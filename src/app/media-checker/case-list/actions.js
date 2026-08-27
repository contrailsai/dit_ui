'use server'

import { get_user_transactions } from "@/utils/cases_functions"

export async function fetchMoreCases(offset, limit, filters = {}) {
    const data = await get_user_transactions(offset, limit, filters);
    return {
        t_list: data?.t_list || [],
        total_count: data?.total_count ?? 0,
    };
}
