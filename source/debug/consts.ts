import { ExperimentArm, FeedbackUiVariant } from '../common/common';

export const feedbackUiVariants = {
	[FeedbackUiVariant.TellUsMore]: 'Show "Tell Us More" intermediate step',
	[FeedbackUiVariant.ForcedModal]: 'Show modal immediately after regret click',
};
export const experimentArms = {
	[ExperimentArm.DislikeAction]: 'Dislike action',
	[ExperimentArm.NotInterestedAction]: 'Not interested action',
	[ExperimentArm.NoRecommendAction]: "Don't recommend channel action",
	[ExperimentArm.RemoveFromHistory]: 'Remove from history action',
	[ExperimentArm.NoAction]: 'Control-with-UX (shows the button but it doesn’t do anything)',
	[ExperimentArm.NoInject]: 'UX-control (doesn’t show the button, but still collects data)',
	[ExperimentArm.OptOut]: 'Opt-out (shows button which does dislike, but no data collection)',
};
