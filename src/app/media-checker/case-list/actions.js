'use server'

import { get_user_transactions } from "@/utils/cases_functions"

export async function fetchMoreCases(offset, limit) {
    const data = await get_user_transactions(offset, limit);
    // Return just the list, assuming 'user' data doesn't change between pages
    return data.t_list || [];
}