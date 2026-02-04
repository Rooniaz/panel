import http from '@/api/http';

export default async (orders: string[]): Promise<void> => {
    await http.put('/api/client/account/menu-order', { orders });
};

