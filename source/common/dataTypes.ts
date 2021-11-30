import { EventType, VideoThumbnailType } from './messages';
import { FeedbackType } from './common';

export type ProcessedEvent = {
	id: string;
	timestamp: Date;
	/** Counts distinct videoIndex watched */
	counter: number;
	tabId: number;
	type: EventType;
	subtype: FeedbackType | VideoThumbnailType;
	payload: ProcessedVideoData | any;
};

export interface VideoData {
	id: string;
	title: string;
	length: string;
	views: string;
	description?: string;
	channel: { url: string };
}

export interface ProcessedVideoData extends VideoData {
	seenAt: Date;
	tabId?: number;
	channel: { title: string; url: string };
	tokens: { notInterested?: string; dontRecommend?: string };
}

// All of the next type definitions were automatically inferred from YT datastructures. Used only as hints.

export interface Data {
	videoId: string;
	thumbnail: ChannelThumbnailClass;
	title: LengthText;
	longBylineText: BylineText;
	publishedTimeText: PublishedTimeTextClass;
	viewCountText: PublishedTimeTextClass;
	lengthText: LengthText;
	navigationEndpoint: DataNavigationEndpoint;
	shortBylineText: BylineText;
	channelThumbnail: ChannelThumbnailClass;
	ownerBadges: OwnerBadge[];
	trackingParams: string;
	shortViewCountText: LengthText;
	menu: Menu;
	thumbnailOverlays: ThumbnailOverlay[];
	accessibility: Accessibility;
	richThumbnail: RichThumbnail;
}

export interface Accessibility {
	accessibilityData: AccessibilityData;
}

export interface AccessibilityData {
	label: string;
}

export interface ChannelThumbnailClass {
	thumbnails: ThumbnailElement[];
}

export interface ThumbnailElement {
	url: string;
	width: number;
	height: number;
}

export interface LengthText {
	accessibility: Accessibility;
	simpleText: string;
}

export interface BylineText {
	runs: LongBylineTextRun[];
}

export interface LongBylineTextRun {
	text: string;
	navigationEndpoint: RunNavigationEndpoint;
}

export interface RunNavigationEndpoint {
	clickTrackingParams: string;
	commandMetadata: NavigationEndpointCommandMetadata;
	browseEndpoint: BrowseEndpoint;
}

export interface BrowseEndpoint {
	browseId: string;
	canonicalBaseUrl: string;
}

export interface NavigationEndpointCommandMetadata {
	webCommandMetadata: PurpleWebCommandMetadata;
}

export interface PurpleWebCommandMetadata {
	url: string;
	webPageType: string;
	rootVe: number;
	apiUrl?: string;
}

export interface Menu {
	menuRenderer: MenuRenderer;
}

export interface MenuRenderer {
	items: ItemElement[];
	trackingParams: string;
	accessibility: Accessibility;
	targetId: string;
}

export interface ItemElement {
	menuServiceItemRenderer: MenuServiceItemRenderer;
}

export interface MenuServiceItemRenderer {
	text: Text;
	icon: Icon;
	serviceEndpoint: MenuServiceItemRendererServiceEndpoint;
	trackingParams: string;
	hasSeparator?: boolean;
}

export interface Icon {
	iconType: string;
}

export interface MenuServiceItemRendererServiceEndpoint {
	clickTrackingParams: string;
	commandMetadata: ServiceEndpointCommandMetadata;
	signalServiceEndpoint?: FluffySignalServiceEndpoint;
	playlistEditEndpoint?: ServiceEndpointPlaylistEditEndpoint;
	addToPlaylistServiceEndpoint?: AddToPlaylistServiceEndpoint;
	feedbackEndpoint?: FeedbackEndpoint;
	getReportFormEndpoint?: GetReportFormEndpoint;
}

export interface AddToPlaylistServiceEndpoint {
	videoId: string;
}

export interface ServiceEndpointCommandMetadata {
	webCommandMetadata: FluffyWebCommandMetadata;
}

export interface FluffyWebCommandMetadata {
	sendPost: boolean;
	apiUrl?: string;
}

export interface FeedbackEndpoint {
	feedbackToken: string;
	uiActions: UIActions;
	actions: FeedbackEndpointAction[];
}

export interface FeedbackEndpointAction {
	clickTrackingParams: string;
	replaceEnclosingAction: ReplaceEnclosingAction;
}

export interface ReplaceEnclosingAction {
	item: ReplaceEnclosingActionItem;
}

export interface ReplaceEnclosingActionItem {
	notificationMultiActionRenderer: NotificationMultiActionRenderer;
}

export interface NotificationMultiActionRenderer {
	responseText: LengthText;
	buttons: Button[];
	trackingParams: string;
}

export interface Button {
	buttonRenderer: ButtonRenderer;
}

export interface ButtonRenderer {
	style: string;
	text: Text;
	serviceEndpoint: ButtonRendererServiceEndpoint;
	trackingParams: string;
}

export interface ButtonRendererServiceEndpoint {
	clickTrackingParams: string;
	commandMetadata: ServiceEndpointCommandMetadata;
	undoFeedbackEndpoint?: UndoFeedbackEndpoint;
	signalServiceEndpoint?: PurpleSignalServiceEndpoint;
}

export interface PurpleSignalServiceEndpoint {
	signal: string;
	actions: PurpleAction[];
}

export interface PurpleAction {
	clickTrackingParams: string;
	signalAction: SignalAction;
}

export interface SignalAction {
	signal: string;
}

export interface UndoFeedbackEndpoint {
	undoToken: string;
	actions: UndoFeedbackEndpointAction[];
}

export interface UndoFeedbackEndpointAction {
	clickTrackingParams: string;
	undoFeedbackAction: UndoFeedbackAction;
}

export interface UndoFeedbackAction {
	hack: boolean;
}

export interface Text {
	runs: TextRun[];
}

export interface TextRun {
	text: string;
}

export interface UIActions {
	hideEnclosingContainer: boolean;
}

export interface GetReportFormEndpoint {
	params: string;
}

export interface ServiceEndpointPlaylistEditEndpoint {
	playlistId: string;
	actions: FluffyAction[];
}

export interface FluffyAction {
	addedVideoId: string;
	action: string;
}

export interface FluffySignalServiceEndpoint {
	signal: string;
	actions: TentacledAction[];
}

export interface TentacledAction {
	clickTrackingParams: string;
	addToPlaylistCommand?: AddToPlaylistCommand;
	openPopupAction?: OpenPopupAction;
}

export interface AddToPlaylistCommand {
	openMiniplayer: boolean;
	openListPanel: boolean;
	videoId: string;
	listType: string;
	onCreateListCommand: OnCreateListCommand;
	videoIds: string[];
}

export interface OnCreateListCommand {
	clickTrackingParams: string;
	commandMetadata: ServiceEndpointCommandMetadata;
	createPlaylistServiceEndpoint: CreatePlaylistServiceEndpoint;
}

export interface CreatePlaylistServiceEndpoint {
	videoIds: string[];
	params: string;
}

export interface OpenPopupAction {
	popup: Popup;
	popupType: string;
}

export interface Popup {
	notificationActionRenderer: NotificationActionRenderer;
}

export interface NotificationActionRenderer {
	responseText: PublishedTimeTextClass;
	trackingParams: string;
}

export interface PublishedTimeTextClass {
	simpleText: string;
}

export interface DataNavigationEndpoint {
	clickTrackingParams: string;
	commandMetadata: NavigationEndpointCommandMetadata;
	watchEndpoint: WatchEndpoint;
}

export interface WatchEndpoint {
	videoId: string;
	nofollow: boolean;
	watchEndpointSupportedOnesieConfig: WatchEndpointSupportedOnesieConfig;
}

export interface WatchEndpointSupportedOnesieConfig {
	html5PlaybackOnesieConfig: Html5PlaybackOnesieConfig;
}

export interface Html5PlaybackOnesieConfig {
	commonConfig: CommonConfig;
}

export interface CommonConfig {
	url: string;
}

export interface OwnerBadge {
	metadataBadgeRenderer: MetadataBadgeRenderer;
}

export interface MetadataBadgeRenderer {
	icon: Icon;
	style: string;
	tooltip: string;
	trackingParams: string;
	accessibilityData: AccessibilityData;
}

export interface RichThumbnail {
	movingThumbnailRenderer: MovingThumbnailRenderer;
}

export interface MovingThumbnailRenderer {
	enableHoveredLogging: boolean;
	enableOverlay: boolean;
}

export interface ThumbnailOverlay {
	thumbnailOverlayTimeStatusRenderer?: ThumbnailOverlayTimeStatusRenderer;
	thumbnailOverlayToggleButtonRenderer?: ThumbnailOverlayToggleButtonRenderer;
	thumbnailOverlayNowPlayingRenderer?: ThumbnailOverlayNowPlayingRenderer;
}

export interface ThumbnailOverlayNowPlayingRenderer {
	text: Text;
}

export interface ThumbnailOverlayTimeStatusRenderer {
	text: LengthText;
	style: string;
}

export interface ThumbnailOverlayToggleButtonRenderer {
	isToggled?: boolean;
	untoggledIcon: Icon;
	toggledIcon: Icon;
	untoggledTooltip: string;
	toggledTooltip: string;
	untoggledServiceEndpoint: UntoggledServiceEndpoint;
	toggledServiceEndpoint?: ToggledServiceEndpoint;
	untoggledAccessibility: Accessibility;
	toggledAccessibility: Accessibility;
	trackingParams: string;
}

export interface ToggledServiceEndpoint {
	clickTrackingParams: string;
	commandMetadata: ServiceEndpointCommandMetadata;
	playlistEditEndpoint: ToggledServiceEndpointPlaylistEditEndpoint;
}

export interface ToggledServiceEndpointPlaylistEditEndpoint {
	playlistId: string;
	actions: StickyAction[];
}

export interface StickyAction {
	action: string;
	removedVideoId: string;
}

export interface UntoggledServiceEndpoint {
	clickTrackingParams: string;
	commandMetadata: ServiceEndpointCommandMetadata;
	playlistEditEndpoint?: ServiceEndpointPlaylistEditEndpoint;
	signalServiceEndpoint?: UntoggledServiceEndpointSignalServiceEndpoint;
}

export interface UntoggledServiceEndpointSignalServiceEndpoint {
	signal: string;
	actions: IndigoAction[];
}

export interface IndigoAction {
	clickTrackingParams: string;
	addToPlaylistCommand: AddToPlaylistCommand;
}
