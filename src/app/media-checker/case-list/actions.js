'use server'

import { get_user_transactions } from "@/utils/cases_functions"

export async function fetchMoreCases(offset, limit) {
    const data = await get_user_transactions(offset, limit);
    return data?.t_list || [];
}