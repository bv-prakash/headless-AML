"use client";

import { useCallback, useState, useMemo, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useQuery, useMutation } from "@apollo/client/react";
import { toast } from "react-toastify";
import { AccountPageTitle } from "@/src/components/account/AccountPageTitle";
import PageLoader from "@/src/components/common/PageLoader";
import { CUSTOMER_INFO_QUERY } from "@/src/framework/graphql/customer/queries/getCustomerInfo";
import {
	UPDATE_CUSTOMER_PROFILE_MUTATION,
	type UpdateCustomerProfileVariables,
	type UpdateCustomerProfileResponse,
} from "@/src/framework/graphql/auth/mutations/updateCustomerProfile";
import {
	CHANGE_CUSTOMER_PASSWORD_MUTATION,
	type ChangeCustomerPasswordVariables,
	type ChangeCustomerPasswordResponse,
} from "@/src/framework/graphql/auth/mutations/changeCustomerPassword";
import type { CustomerForCheckoutResponse } from "@/src/framework/graphql/customer/types";

type ProfileFormData = {
	firstname: string;
	lastname: string;
	telephone: string;
    changePhone: boolean;
	changePassword: boolean;
	currentPassword: string;
	password: string;
	passwordConfirmation: string;
};

const MIN_PASSWORD_LENGTH = 8;
const LEGEND_CLASSES = "block-title font-normal text-black text-lg leading-[23px] md:text-2xl md:leading-[30px]";

const getPasswordStrength = (value: string): "Weak" | "Medium" | "Strong" => {
	if (value.length < MIN_PASSWORD_LENGTH) return "Weak";
	if (value.length >= 12 && /[A-Z]/.test(value) && /[0-9]/.test(value)) return "Strong";
	return "Medium";
};

const getPasswordStrengthColor = (strength: "Weak" | "Medium" | "Strong"): string => {
	const colors = {
		Weak: "text-gray-600",
		Medium: "text-yellow-600",
		Strong: "text-green-600",
	};
	return colors[strength];
};

export default function MyAccountProfilePage() {
	const [showCurrentPassword, setShowCurrentPassword] = useState(false);
	const [showNewPassword, setShowNewPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const [mutationError, setMutationError] = useState<string | null>(null);

	const { data, loading: queryLoading, error: queryError } = useQuery<CustomerForCheckoutResponse>(CUSTOMER_INFO_QUERY);
	const customer = data?.customer;

	// Initialize form with customer data
	const { register, handleSubmit, watch, formState: { errors, isSubmitting }, reset } = useForm<ProfileFormData>({
		mode: "onChange",
		defaultValues: useMemo(
			() => ({
				firstname: customer?.firstname ?? "",
				lastname: customer?.lastname ?? "",
				telephone: customer?.telephone ?? "",
				changePassword: false,
				currentPassword: "",
				password: "",
				passwordConfirmation: "",
			}),
			[customer?.firstname, customer?.lastname, customer?.telephone]
		),
	});

	const changePasswordChecked = watch("changePassword");
	const changePhoneChecked = watch("changePhone");
	const passwordValue = watch("password");

	// Memoized password strength
	const passwordStrength = useMemo(() => (passwordValue ? getPasswordStrength(passwordValue) : null), [passwordValue]);
	const strengthColor = useMemo(
		() => (passwordStrength ? getPasswordStrengthColor(passwordStrength) : ""),
		[passwordStrength]
	);

	const [updateProfile, { loading: updateLoading }] = useMutation<UpdateCustomerProfileResponse, UpdateCustomerProfileVariables>(
		UPDATE_CUSTOMER_PROFILE_MUTATION,
		{ errorPolicy: "all" }
	);

	const [changePassword, { loading: changePasswordLoading }] = useMutation<ChangeCustomerPasswordResponse, ChangeCustomerPasswordVariables>(
		CHANGE_CUSTOMER_PASSWORD_MUTATION,
		{ errorPolicy: "all" }
	);

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			setMutationError(null);
		};
	}, []);

	// Update form when customer data changes
	useEffect(() => {
		if (customer) {
			reset({
				firstname: customer.firstname ?? "",
				lastname: customer.lastname ?? "",
				telephone: customer.telephone ?? "",
				changePassword: false,
				currentPassword: "",
				password: "",
				passwordConfirmation: "",
			});
		}
	}, [customer, reset]);

	const validatePasswordChange = useCallback((formData: ProfileFormData): boolean => {
		if (!formData.changePassword) return true;

		if (!formData.currentPassword?.trim()) {
			setMutationError("Current password is required");
			return false;
		}
		if (!formData.password?.trim()) {
			setMutationError("New password is required");
			return false;
		}
		if (formData.password.length < MIN_PASSWORD_LENGTH) {
			setMutationError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
			return false;
		}
		if (formData.password !== formData.passwordConfirmation) {
			setMutationError("Passwords do not match");
			return false;
		}
		return true;
	}, []);

	const validatePhoneChange = useCallback((formData: ProfileFormData): boolean => {
		if (!formData.changePhone) return true;

		if (!formData.telephone?.trim()) {
			setMutationError("Phone number is required");
			return false;
		}
		return true;
	}, []);

	const onSubmit = useCallback(
		async (formData: ProfileFormData) => {
			setMutationError(null);

			if (!validatePasswordChange(formData)) {
				toast.error(mutationError || "Validation failed");
				return;
			}

			if (!validatePhoneChange(formData)) {
				toast.error(mutationError || "Validation failed");
				return;
			}


			try {
				// Update password if checkbox is checked
				if (formData.changePassword) {
					await changePassword({
						variables: {
							currentPassword: formData.currentPassword,
							newPassword: formData.password,
						},
					});
					toast.success("Password changed successfully!");
				}
				if (formData.changePhone) {
					toast.success("Phone number updated successfully!");
				}

				// Always update profile info (firstname, lastname)
				const profileInput = {
					firstname: formData.firstname?.trim(),
					lastname: formData.lastname?.trim(),
				};

				await updateProfile({ variables: { input: profileInput } });
				
				if (!formData.changePassword) {
					toast.success("Profile updated successfully!");
				} else {
					toast.success("Profile and password updated successfully!");
				}

				// Reset form with updated data
				reset({
					firstname: formData.firstname,
					lastname: formData.lastname,
					telephone: formData.changePhone ? formData.telephone : customer?.telephone ?? "",
					changePassword: false,
					currentPassword: "",
					password: "",
					passwordConfirmation: "",
				});
			} catch (error) {
				const errorMessage =
					error instanceof Error
						? error.message
						: "Failed to update profile. Please try again later.";
				setMutationError(errorMessage);
				toast.error(errorMessage);
				console.error("Profile update error:", error);
			}
		},
		[validatePasswordChange, updateProfile, changePassword, reset, mutationError]
	);

	if (queryLoading) {
		return <PageLoader label="Loading profile information..." minHeightClassName="min-h-[50vh]" />;
	}

	if (queryError) {
		return (
			<div className="space-y-3">
				<AccountPageTitle />
				<div className="block block-dashboard bg-red-50 p-6">
					<p className="text-red-600">Failed to load profile. Please try again later.</p>
				</div>
			</div>
		);
	}

	return (
		<div>
			<AccountPageTitle />
			<div className="block block-dashboard">
				<form onSubmit={handleSubmit(onSubmit)} noValidate className="max-w-[500px]">
					{mutationError && (
						<div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-800 text-sm">
							{mutationError}
						</div>
					)}

					{/* Account Information Section */}
					<fieldset className="fieldset info mb-6" disabled={queryLoading || updateLoading || changePasswordLoading}>
						<legend className="legend mb-4">
							<span className={LEGEND_CLASSES}>Account Information</span>
						</legend>

						{/* First Name */}
						<div className="mb-7.5">
							<label htmlFor="firstname" className="sr-only block text-sm font-medium mb-2">
								First Name
								<span className="text-light-red ml-1">*</span>
							</label>
							<input
								id="firstname"
								type="text"
								placeholder="First Name"
								disabled
								autoComplete="given-name"
								{...register("firstname", { required: "First Name is required" })}
								className="w-full h-10 py-0 px-[15px] md:h-12.5 md:px-5  border border-ccc focus:outline-none focus:ring-2  bg-f4f4f4 text-aaa cursor-not-allowed"
							/>
							{errors.firstname && (
								<p className="text-light-red text-sm mt-1" role="alert">
									{errors.firstname.message}
								</p>
							)}
						</div>

						{/* Last Name */}
						<div className="mb-7.5">
							<label htmlFor="lastname" className="block sr-only text-sm font-medium mb-2">
								Last Name
								<span className="text-red-500 ml-1">*</span>
							</label>
							<input
								id="lastname"
								type="text"
								placeholder="Last Name"
								disabled
								autoComplete="family-name"
								{...register("lastname", { required: "Last Name is required" })}
								className="w-full h-10 py-0 px-[15px] md:h-12.5 md:px-5  border border-ccc focus:outline-none focus:ring-2  bg-f4f4f4 text-aaa cursor-not-allowed"
							/>
							{errors.lastname && (
								<p className="text-light-red text-sm mt-1" role="alert">
									{errors.lastname.message}
								</p>
							)}
						</div>

						{/* Change Phone Checkbox */}
						<div className="flex items-start gap-2 mb-4">
							<input
								type="checkbox"
								id="change-phone"
								{...register("changePhone")}
							/>
							<label htmlFor="change-phone" className="cursor-pointer font-normal">
								Change Phone
							</label>
							<div className="flex-1">
								{errors.changePhone && (
									<p className="text-light-red text-sm mt-1" role="alert">
										{errors.changePhone.message}
									</p>
								)}
							</div>
						</div>

						{/* Change Password Checkbox */}
						<div className="flex items-start gap-2">
							<input
								type="checkbox"
								id="change-password"
								{...register("changePassword")}
							/>
							<label htmlFor="change-password" className="cursor-pointer font-normal">
								Change Password
							</label>
							<div className="flex-1">
								{errors.changePassword && (
									<p className="text-light-red text-sm mt-1" role="alert">
										{errors.changePassword.message}
									</p>
								)}
							</div>
						</div>
					</fieldset>

					{/* Change Phone Section */}
					{changePhoneChecked && (
						<fieldset className="fieldset phone-number mb-6" disabled={queryLoading || updateLoading || changePasswordLoading}>
							<legend className="legend mb-4">
								<span className={LEGEND_CLASSES}>Change Phone Number</span>
							</legend>

							{/* Current Password */}
							<div className="mb-4">
								<label htmlFor="current-password" className="sr-only block text-sm font-medium mb-2">
									Phone Number
									<span className="text-red-500 ml-1">*</span>
								</label>
								<div className="relative">
									<input
										type="tel"
										id="current-phone"
										placeholder="Current Phone Number"
										{...register("telephone", {
											required: changePhoneChecked ? "Current phone number is required" : false,
										})}
										className={`w-full h-10 py-0 px-[15px] md:h-12.5 md:px-5 border focus:outline-none focus:ring-2 bg-white text-black ${errors.telephone ? "border-light-red" : "border-ccc"}`}
									/>
								</div>
								{errors.telephone && (
									<p className="text-light-red text-sm mt-2" role="alert">
										{errors.telephone.message}
									</p>
								)}
							</div>
						</fieldset>
					)}

					{/* Change Password Section */}
					{changePasswordChecked && (
						<fieldset className="fieldset password mb-6" disabled={queryLoading || updateLoading || changePasswordLoading}>
							<legend className="legend mb-4">
								<span className={LEGEND_CLASSES}>Change Password</span>
							</legend>

							{/* Current Password */}
							<div className="mb-4">
								<label htmlFor="current-password" className="sr-only block text-sm font-medium mb-2">
									Current Password
									<span className="text-red-500 ml-1">*</span>
								</label>
								<div className="relative">
									<input
										type={showCurrentPassword ? "text" : "password"}
										id="current-password"
										placeholder="Current Password"
										autoComplete="current-password"
										{...register("currentPassword", {
											required: changePasswordChecked ? "Current password is required" : false,
										})}
										className={`w-full h-10 py-0 px-[15px] md:h-12.5 md:px-5 border focus:outline-none focus:ring-2 bg-white text-black ${errors.currentPassword ? "border-light-red" : "border-ccc"}`}
									/>
									<button
										type="button"
										onClick={() => setShowCurrentPassword(!showCurrentPassword)}
										className="absolute top-1/2 right-2 flex -translate-y-1/2 p-2 text-sm text-black hover:text-theme-primary focus:outline-none focus:ring-1 rounded"
										title={showCurrentPassword ? "Hide password" : "Show password"}
										aria-label={showCurrentPassword ? "Hide current password" : "Show current password"}
									>
										{showCurrentPassword ? <i className="icon-password-hide" /> : <i className="icon-view before:text-xs" />}
									</button>
								</div>
								{errors.currentPassword && (
									<p className="text-light-red text-sm mt-2" role="alert">
										{errors.currentPassword.message}
									</p>
								)}
							</div>

							{/* New Password */}
							<div className="mb-4">
								<label htmlFor="password" className="sr-only block text-sm font-medium mb-2">
									New Password
									<span className="text-red-500 ml-1">*</span>
								</label>
								<div className="relative">
									<input
										type={showNewPassword ? "text" : "password"}
										id="password"
										placeholder="New Password"
										autoComplete="new-password"
										{...register("password", {
											required: changePasswordChecked ? "New password is required" : false,
											minLength: {
												value: MIN_PASSWORD_LENGTH,
												message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
											},
										})}
										className={`w-full h-10 py-0 px-[15px] md:h-12.5 md:px-5 border focus:outline-none focus:ring-2 bg-white text-black ${errors.password ? "border-light-red" : "border-ccc"}`}
									/>
									<button
										type="button"
										onClick={() => setShowNewPassword(!showNewPassword)}
										className="absolute top-1/2 right-2 flex -translate-y-1/2  p-2 text-sm text-black hover:text-theme-primary focus:outline-none focus:ring-1 rounded"
										title={showNewPassword ? "Hide password" : "Show password"}
										aria-label={showNewPassword ? "Hide new password" : "Show new password"}
									>
										{showNewPassword ? <i className="icon-password-hide" /> : <i className="icon-view before:text-xs" />}
									</button>
								</div>
								{passwordStrength && (
									<div className={`h-10 bg-f4f4f4 text-black py-0 px-[15px] flex items-center mb-2 ${strengthColor}`}>
										Password strength: {passwordStrength}
									</div>
								)}
								{errors.password && (
									<p className="text-light-red text-sm mt-2" role="alert">
										{errors.password.message}
									</p>
								)}
								
							</div>

							{/* Confirm Password */}
							<div className="mb-4">
								<label htmlFor="password-confirmation" className="sr-only block text-sm font-medium mb-2">
									Confirm New Password
									<span className="text-red-500 ml-1">*</span>
								</label>
								<div className="relative">
									<input
										type={showConfirmPassword ? "text" : "password"}
										id="password-confirmation"
										placeholder="Confirm New Password"
										autoComplete="new-password"
										{...register("passwordConfirmation", {
											required: changePasswordChecked ? "Confirm password is required" : false,
											validate: (value) =>
												changePasswordChecked && value !== passwordValue ? "Passwords do not match" : true,
										})}
										className={`w-full h-10 py-0 px-[15px] md:h-12.5 md:px-5 border focus:outline-none focus:ring-2 bg-white text-black ${errors.passwordConfirmation ? "border-light-red" : "border-ccc"}`}
									/>
									<button
										type="button"
										onClick={() => setShowConfirmPassword(!showConfirmPassword)}
										className="absolute top-1/2 right-2 flex -translate-y-1/2 p-2 text-sm text-black hover:text-theme-primary focus:outline-none focus:ring-1 rounded"
										title={showConfirmPassword ? "Hide password" : "Show password"}
										aria-label={showConfirmPassword ? "Hide confirmation password" : "Show confirmation password"}
									>
										{showConfirmPassword ? <i className="icon-password-hide" /> : <i className="icon-view before:text-xs" />}
									</button>
								</div>
								{errors.passwordConfirmation && (
									<p className="text-light-red text-sm mt-2" role="alert">
										{errors.passwordConfirmation.message}
									</p>
								)}
							</div>
						</fieldset>
					)}

					{/* Form Actions */}
					<div className="form-actions mt-6 flex gap-4">
						<button
							type="submit"
							disabled={updateLoading || queryLoading || changePasswordLoading}
							className="block w-auto py-2 px-5 text-sm text-center cursor-pointer bg-theme-primary text-white font-bold uppercase text-sm hover:opacity-90 transition-opacity mt-2 disabled:bg-theme-primary/70 disabled:cursor-not-allowed"
						>
							{(updateLoading || changePasswordLoading) ? (
								<>
									<div className="flex items-center gap-2">
										<span className="inline-block h-4 w-4 border-2 border-white border-t-transparent-full animate-spin"></span>
										Saving...
									</div>
								</>
							) : (
								"Save"
							)}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}

