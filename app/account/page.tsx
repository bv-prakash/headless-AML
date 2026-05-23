"use client";

import { useQuery } from "@apollo/client/react";
import Link from "next/link";
import { AccountPageTitle } from "@/src/components/account/AccountPageTitle";
import { InformationBox } from "@/src/components/account/InformationBox";
import { AddressBook } from "@/src/components/account/address/AddressBook";
import { DashboardRecentOrders } from "@/src/components/account/DashboardRecentOrders";
import PageLoader from "@/src/components/common/PageLoader";
import { CUSTOMER_INFO_QUERY } from "@/src/framework/graphql/customer/queries/getCustomerInfo";
import type { CustomerForCheckoutResponse } from "@/src/framework/graphql/customer/types";

export default function MyAccountDashboardPage() {
	const { data, loading } = useQuery<CustomerForCheckoutResponse>(CUSTOMER_INFO_QUERY);
	const customer = data?.customer;

	if (loading) {
		return <PageLoader label="Loading account information..." minHeightClassName="min-h-[50vh]" />;
	}

	const contactContent = (
		<p>
			<strong className="block">{customer?.firstname} {customer?.lastname}</strong>
			<a href={`mailto:${customer?.email}`}>{customer?.email}</a>
		</p>
	);

	const newsletterContent = (
		<div>
			{customer?.is_subscribed ? (
				<p>
					You are subscribed to "General Subscription".
				</p>
			) : (
				<p>You are not subscribed to "General Subscription".</p>
			)}
		</div>
	);

	return (
		<div className="space-y-3">
			<AccountPageTitle />
			<div className="block account-information mb-12.5">
				<div className="block-title font-normal text-black text-lg leading-[23px] md:text-2xl md:leading-[30px] mb-[15px] md:mb-5">
					Account Information
				</div>
				<div className="block-content flex  flex-wrap lg:no-wrap lg:gap-10">
					<InformationBox
						title="Contact Information"
						content={contactContent}
						actions={
							<Link href="/account/profile" className="action text-theme-primary flex no-wrap gap-2 items-baseline leading-[17px] ">
								<i className="icon-password "></i>
								Change Password
							</Link>
						}
					/>

					<InformationBox
						title="Newsletters"
						content={newsletterContent}
						actions={
							<Link href="/account/newsletter" className="action text-theme-primary flex no-wrap gap-2 items-baseline leading-[17px] ">
								<i className="icon-edit "></i>
								Edit
							</Link>
						}
					/>
				</div>
			</div>
			<DashboardRecentOrders />
			<div className="block address-book">
				<div className="block-title font-normal text-black text-lg leading-[23px] md:text-2xl md:leading-[30px] mb-[15px] md:mb-5">
					Address Book
				</div>

				<AddressBook addresses={customer?.addresses} />
			</div>
		</div>
	);
}

