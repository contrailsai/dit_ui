import { get_user_data } from '@/utils/user_functions';
import Footer from '@/components/Footer';
import Result_container from "@/app/view/[id]/show_result";
import Verifier_results_container from "@/app/view/[id]/verifier_show_results";
import { get_result_for_id, get_assets_for_id, get_user_email_by_id } from "@/utils/cases_functions";
import { redirect } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

const Page = async ({ params }) => {
  // Ensure params is resolved
  const { id } = await Promise.resolve(params);

  const user_data = await get_user_data();
  if (!user_data) {
    return redirect("/login");
  }

  const case_result_data = await get_result_for_id(id);
  const assets = await get_assets_for_id(id);
  const client_email = user_data.user_type === "verifier" ? await get_user_email_by_id(case_result_data.user_id) : "";

  const has_result = typeof(case_result_data["prediction"]) === "boolean";

  return (
    <>
      <Sidebar user={user_data} />

      <div className="pl-40 min-h-screen bg-slate-50">
        {
          user_data.user_type === "verifier" ?
            <Verifier_results_container
              client_email={client_email}
              res_data={case_result_data}
              saved_assets={assets}
            />
            :
            user_data.user_type === "direct" ?
              (
                <>
                  {
                    has_result ?
                      <Result_container 
                        res_data={case_result_data} 
                        assets={assets}
                      />
                      :
                      <PendingResults />
                  }
                </>
              ) :
              (
                <>
                  {
                    case_result_data.status ?
                      <Result_container res_data={case_result_data} assets={assets} />
                      :
                      <PendingResults />
                  }
                </>
              )
        }
        <Footer />
      </div>
    </>
  );
}

const PendingResults = () => (
  <div className="flex flex-col gap-3 items-center text-center pt-28 px-16 min-h-[90vh]">
    <div className="size-16 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center mb-2">
      <div className="size-3 rounded-full bg-amber-400 animate-pulse" />
    </div>
    <span className="text-3xl font-semibold text-slate-800 tracking-tight">
      Analysis in progress
    </span>
    <span className="font-light text-lg text-slate-500 max-w-md">
      Results are not available yet. They will appear here once processing finishes.
    </span>
  </div>
);

export default Page;
