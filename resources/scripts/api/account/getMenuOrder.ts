import http from '@/api/http';

export interface MenuOrderResponse {
    orders: string[];
}

export default async (): Promise<MenuOrderResponse> => {
    const { data } = await http.get('/api/client/account/menu-order');

    return data;
};

