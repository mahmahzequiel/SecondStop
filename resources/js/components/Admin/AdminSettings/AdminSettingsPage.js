import React from 'react';
import { Tabs } from 'antd';
import BrandTab from './BrandTab/BrandTab';
import CategoryTab from './CategoryTab/CategoryTab';
import CategoryTypeTab from './CategoryTypeTab/CategoryTypeTab';
import AdminPage from '../../AdminReusable/AdminPage';
import RoleTab from './RoleTab';

export default function Adminsetting() {
    const onChange = (key) => {
        console.log(key);
    };
    
    const items = [
        {
            key: 'role',
            label: 'Role',
            children: <RoleTab />,
        },
        {
            key: 'brand',
            label: 'Brand',
            children: <BrandTab />,
        },
        {
            key: 'category',
            label: 'Category',
            children: <CategoryTab />,
        },
        {
            key: 'categorytype',
            label: 'Category Type',
            children: <CategoryTypeTab />,
        },
    ];
    
    return (
        <AdminPage title="ADMIN SETTINGS" headerIcon="bxs-cog">
            <Tabs
                defaultActiveKey="role"
                items={items}
                onChange={onChange}
                id="tbl-style"
                type="line" 
                tabBarGutter={16} 
                tabPosition="top" 
                moreIcon={<i className="bx bx-dots-horizontal-rounded" />} 
            />
        </AdminPage>
    );
}