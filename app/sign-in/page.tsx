"use client";

import loginBackgroundImage from "@/public/images/login-bg.jpg";
function SignInPage() {
    return (
        <div
            className="bg-cover bg-center h-screen w-full"
            style={{ backgroundImage: `url(${loginBackgroundImage.src})` }}
        >
            <div className="container">
                <div className="row">
                    <div className="col-12">
                        <h1>Sign In</h1>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default SignInPage;