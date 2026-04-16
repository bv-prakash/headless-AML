"use client";

import { useForm } from "react-hook-form";
import { useQuery, useMutation } from "@apollo/client/react";
import { toast } from "react-toastify";
import { AccountPageTitle } from "@/src/components/account/AccountPageTitle";
import PageLoader from "@/src/components/common/PageLoader";
import { CUSTOMER_INFO_QUERY } from "@/src/framework/graphql/queries";
import { UPDATE_CUSTOMER_NEWSLETTER_MUTATION } from "@/src/framework/graphql/mutations/newslatterSubscribe";
import type { CustomerForCheckoutResponse } from "@/src/framework/graphql/queries/customerInfo";
import type { UpdateCustomerNewsletterVariables, UpdateCustomerNewsletterResponse } from "@/src/framework/graphql/mutations/newslatterSubscribe";

type NewsletterFormData = {
	isSubscribed: boolean;
};

export default function NewsletterSubscriptionsPage() {
	const { data, loading: queryLoading } = useQuery<CustomerForCheckoutResponse>(CUSTOMER_INFO_QUERY);
	const customer = data?.customer;

	const { register, handleSubmit, formState: { isSubmitting }, reset } = useForm<NewsletterFormData>({
		defaultValues: {
			isSubscribed: customer?.is_subscribed ?? false,
		},
	});

	const [updateNewsletter] = useMutation<UpdateCustomerNewsletterResponse, UpdateCustomerNewsletterVariables>(
		UPDATE_CUSTOMER_NEWSLETTER_MUTATION
	);

	const onSubmit = async (formData: NewsletterFormData) => {
		try {
			await updateNewsletter({
				variables: {
					isSubscribed: formData.isSubscribed,
				},
			});
			toast.success("Newsletter subscription updated successfully!");
			reset(formData);
		} catch (error) {
			toast.error("Failed to update newsletter subscription. Please try again.");
		}
	};

	if (queryLoading) {
		return <PageLoader label="Loading newsletter preferences..." />;
	}

	return (
		<div className="space-y-3">
			<AccountPageTitle />
			<form onSubmit={handleSubmit(onSubmit)}>
				<fieldset className="fieldset">
					<legend className="block-title font-normal text-black text-lg leading-[23px] md:text-2xl md:leading-[30px] mb-[15px] md:mb-5">Subscription option</legend>
					<div className="field choice flex items-center gap-2">
						<input
							type="checkbox"
							id="subscription"
							title="General Subscription"
							disabled={isSubmitting}
							{...register("isSubscribed", {
								setValueAs: (value) => value === true || value === "on",
							})}
							className="checkbox"
						/>
						<label htmlFor="subscription" className="label">
							<span>General Subscription</span>
						</label>
					</div>
				</fieldset>

				<div className="form-actions mt-6 flex gap-4">
					<button
						type="submit"
						disabled={isSubmitting}
						className="block w-auto py-2 px-5 text-sm text-center cursor-pointer bg-theme-primary text-white font-bold uppercase text-sm hover:opacity-90 transition-opacity mt-2 disabled:bg-theme-primary/70 disabled:cursor-not-allowed"
					>
						{isSubmitting ? (
							<div className="flex items-center gap-2">
								<span className="inline-block h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
								Saving...
							</div>
						) : (
							"Save"
						)}
					</button>
				</div>
			</form>
		</div>
	);
}

