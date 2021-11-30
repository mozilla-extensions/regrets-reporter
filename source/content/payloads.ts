export const makeDislikePayload = (videoId: string) => ({
	context: {
		client: {
			hl: 'en',
			clientName: 'WEB',
			clientVersion: '2.20210711.07.00',
		},
		user: {
			lockedSafetyMode: false,
		},
		request: {
			useSsl: true,
			internalExperimentFlags: [],
			consistencyTokenJars: [],
		},
	},
	target: {
		videoId,
	},
});

/** Crafts fetch payload for a given videoId and feedbackToken */
export const makeFeedbackPayload = (videoId: string, feedbackToken: string) => ({
	context: {
		client: {
			hl: 'en',
			clientName: 'WEB',
			clientVersion: '2.20210711.07.00',
		},
		user: {
			lockedSafetyMode: false,
		},
		request: {
			useSsl: true,
			internalExperimentFlags: [],
			consistencyTokenJars: [],
		},
	},
	isFeedbackTokenUnencrypted: false,
	shouldMerge: false,
	feedbackTokens: [feedbackToken],
});
