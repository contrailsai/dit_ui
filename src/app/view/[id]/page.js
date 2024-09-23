import { get_user_data } from '@/utils/data_fetch';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Result_container from "@/app/view/[id]/show_result";
import Verifier_results_container from "@/app/view/[id]/verifier_show_results";
import { get_result_for_id, verify_case } from "@/utils/data_fetch";
import { redirect } from 'next/navigation';


const page = async ({ params }) => {
  const user_data = await get_user_data();
  const case_result_data = await get_result_for_id(params.id);
  // const case_result_data = {}

  if (!user_data) {
      return redirect("/login");
  }

  return (
    <>
      <Navbar user_data={user_data} />

      {
        user_data.verifier ?
          // VERIFIER BASED
          <Verifier_results_container res_data={case_result_data} />
          :
          <>
            {/* NORMAL USER */}
            {
              case_result_data.status ?
                <Result_container res_data={case_result_data} />
                :
                <>
                  <div className=' text-xl pt-28 pb-10 px-16'>
                    <span className=' underline px-2'>
                      Status:
                    </span>
                    <span className=' font-light'>
                      Results are currently not available. <br /> (they will be updated shorty)
                    </span>
                  </div>
                </>
            }
          </>
      }
      <Footer/>
    </>
  );
}
export default page;
