import * as React from 'react';

export function YourPrivacy() {
	return (
		<section className="mt-24">
			<h2 className="text-huge font-changa font-light">Your Privacy</h2>
			<p className="mt-4">
				Mozilla understands the sensitivity of the data that is collected and works hard to keep your data private and
				secure:
			</p>
			<ul>
				<li className="mt-7">
					<div className="font-semibold">General data collection principles</div>
					<ul className="triangle-bullets">
						<li>You must be 18 or older to use RegretsReporter.</li>
						<li>No data is collected from inside Private Browsing windows.</li>
						<li>
							If you participate in our research, periodically, information about the number of videos you view, when
							and for what videos you press the “stop recommending”, “dislike”, “not interested”, or “don’t recommend
							channel” buttons, and information about what videos you are recommended will be sent to Mozilla.
						</li>
					</ul>
				</li>
				<li className="mt-10">
					<div className="font-semibold">Understand how your data is used</div>
					<ul className="triangle-bullets">
						<li>
							Data — including the videos you report and the comments you submit — from the RegretsReporter extension
							will be used in Mozilla Foundation's advocacy and campaigning work. It will be shared with organizations
							working to investigate these problems and technologists working to build more trustworthy AI. When we
							disclose information, we disclose it in a way that minimizes the risk of you being re-identified.
						</li>
					</ul>
				</li>
			</ul>
		</section>
	);
}
