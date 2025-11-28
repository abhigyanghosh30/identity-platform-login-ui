import { LoginFlow } from "@ory/client";
import { useRouter } from "next/router";
import type { NextPage } from "next";
import React, { useEffect, useState } from "react";
import PageLayout from "../components/PageLayout";
import { Button, Input } from "@canonical/react-components";
import { handleFlowError } from "../util/handleFlowError";
import { kratos } from "../api/kratos";
import { FlowResponse } from "./consent";

const RegisterEmail: NextPage = () => {
	const [flow, setFlow] = useState<LoginFlow>();
	const router = useRouter();
	const { return_to: returnTo, flow: flowId, login_challenge } = router.query;

	const redirectToErrorPage = () => {
		const idParam = flowId ? `?id=${flowId.toString()}` : "";
		window.location.href = `./error${idParam}`;
	};

	useEffect(() => {
		if (!router.isReady) {
			return;
		}

		if (flowId && flow) {
			return;
		}

		// If ?flow=.. was in the URL, we fetch it
		if (flowId) {
			kratos
				.getLoginFlow({ id: String(flowId) })
				.then((res) => setFlow(res.data))
				.catch(handleFlowError("login", setFlow))
				.catch(redirectToErrorPage);
			return;
		}

		const getReturnTo = () => {
			if (returnTo) {
				return String(returnTo);
			}
			if (login_challenge) {
				return undefined;
			}
			return window.location.pathname;
		};

		kratos
			.createBrowserRegistrationFlow({
				returnTo: getReturnTo(),
				loginChallenge: login_challenge ? String(login_challenge) : undefined,
			})
			.then(async ({ data }: FlowResponse) => {
				if (data.redirect_to !== undefined) {
					window.location.href = data.redirect_to;
					return;
				}

				await router.replace(
					{
						pathname: "/ui/register",
						query: {
							...router.query,
							flow: data.id,
						},
					},
					undefined,
					{ shallow: true },
				);

				setFlow(data);
			})
			.catch(handleFlowError("login", setFlow))
			.catch(redirectToErrorPage);
	}, [flowId, router, router.isReady, returnTo, flow, login_challenge]);

	return (
		<PageLayout title="Create an account">
			<Input
				id="email"
				name="email"
				type="text"
				label="Email"
				placeholder="Your email"
			/>
			<Button type="button" className="u-no-margin--bottom">
				Back
			</Button>
			<Button
				type="submit"
				appearance="positive"
				className="u-no-margin--bottom"
			>
				Next
			</Button>
		</PageLayout>
	);
};

export default RegisterEmail;
