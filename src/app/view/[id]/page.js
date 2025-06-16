import { get_user_data } from '@/utils/data_fetch';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Result_container from "@/app/view/[id]/show_result";
import Verifier_results_container from "@/app/view/[id]/verifier_show_results";
import { get_result_for_id, get_assets_for_id, get_user_email_by_id } from "@/utils/data_fetch";
import { redirect } from 'next/navigation';

const page = async ({ params }) => {
  // Ensure params is resolved
  const { id } = await Promise.resolve(params);
  
  const user_data = await get_user_data();
  if (!user_data) {
    return redirect("/login");
  }

  const case_result_data = await get_result_for_id(id);
  const assets = await get_assets_for_id(id);
  const client_email = user_data.verifier ? await get_user_email_by_id(case_result_data.user_id) : "";

  return (
    <>
      <Navbar user_data={user_data} />

      {
        user_data.verifier ?
          // VERIFIER BASED 
          <Verifier_results_container 
            client_email={client_email} 
            res_data={case_result_data} 
            saved_assets={assets}
          />
          :
          <>
            {/* NORMAL USER */}
            {
              case_result_data.status ?
                <Result_container res_data={case_result_data} assets={assets} />
                :
                <div className=' flex flex-col gap-2 items-center text-xl pt-28 px-16 min-h-[95vh]'>
                  <span className=' text-4xl underline px-2 pb-8'>
                    Status
                  </span>
                  <span className=' font-light text-2xl '>
                    Results are currently not available. 
                  </span>
                  <span className=' font-light '>
                    (they will be updated shorty) 
                  </span>
                </div>
            }
          </>
      }
      <Footer />
    </>
  );
}

export default page;
