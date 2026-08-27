import { get_user_data } from '@/utils/user_functions';
import Footer from '@/components/Footer';
import Result_container from "@/app/view/[id]/show_result";
import Verifier_results_container from "@/app/view/[id]/verifier_show_results";
import { get_result_for_id, get_assets_for_id, get_user_email_by_id } from "@/utils/cases_functions";
import { getTransactionResultKind } from "@/lib/deepfake-api/envelope";
import { hydrateDetectResultsIfNeeded } from "@/lib/deepfake-api/hydrate";
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';

export const maxDuration = 300;

const Page = async ({ params }) => {
  const { id } = await Promise.resolve(params);

  const user_data = await get_user_data();
  if (!user_data) {
    return redirect("/login");
  }

  let case_result_data = await get_result_for_id(id);
  if (case_result_data?.error) {
    return redirect("/media-checker/case-list");
  }

  // Demo / platform_detect / image-verification may be missing models_responses
  // even after a successful detect — hydrate from the API before choosing UI.
  case_result_data = await hydrateDetectResultsIfNeeded(case_result_data);

  const assets = await get_assets_for_id(id);
  const client_email = user_data.user_type === "verifier" ? await get_user_email_by_id(case_result_data.user_id) : "";

  const method = case_result_data?.method;
  const isNewApiMethod = method === "demo" || method === "platform_detect";
  const resultKind = getTransactionResultKind(case_result_data);

  let body;
  if (resultKind === "pending") {
    body = <PendingResults />;
  } else if (resultKind === "v3" || isNewApiMethod) {
    // New API / demo envelope → ResultV3 via Result_container
    body = (
      <Result_container
        res_data={case_result_data}
        assets={assets}
      />
    );
  } else if (user_data.user_type === "verifier") {
    // Legacy metadata shape → verifier tooling
    body = (
      <Verifier_results_container
        client_email={client_email}
        res_data={case_result_data}
        saved_assets={assets}
      />
    );
  } else {
    body = (
      <Result_container
        res_data={case_result_data}
        assets={assets}
      />
    );
  }

  return (
    <>
      <Sidebar user={user_data} />
      <div className="pl-40 min-h-screen bg-slate-50">
        {body}
        <Footer />
      </div>
    </>
  );
}

const PendingResults = () => (
  <div className="flex flex-col gap-4 items-center text-center pt-28 px-16 min-h-[90vh]">
    <div className="size-16 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center mb-2">
      <div className="size-3 rounded-full bg-amber-400 animate-pulse" />
    </div>
    <span className="text-3xl font-semibold text-slate-800 tracking-tight">
      Analysis in progress
    </span>
    <span className="font-light text-lg text-slate-500 max-w-md">
      Results are not available yet. Check again later once processing finishes.
    </span>
    <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
      <Link
        href="/media-checker/case-list"
        className="px-5 py-2.5 rounded-full border border-slate-200 bg-white text-slate-800 font-medium shadow-sm hover:border-primary/40 hover:text-primary transition-all"
      >
        Cases list
      </Link>
      <Link
        href="/media-checker"
        className="px-5 py-2.5 rounded-full bg-primary text-white font-medium shadow-sm hover:opacity-90 transition-all"
      >
        New analysis
      </Link>
    </div>
  </div>
);

export default Page;
