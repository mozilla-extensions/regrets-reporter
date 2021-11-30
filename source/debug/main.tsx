import * as React from 'react';
import { useCallback, useEffect, useState } from 'react';
import { Message } from '../common/messages';
import { browser } from 'webextension-polyfill-ts';
import { ProcessedEvent, ProcessedVideoData } from '../common/dataTypes';
import { Column, usePagination, useTable } from 'react-table';
import Pagination from './paginate';
import './main.css';
import {
	dispatchSendFeedbackEvent,
	experimentArm,
	ExperimentArm,
	feedbackUiVariant,
	FeedbackUiVariant,
	installationId,
} from '../common/common';
import Inspector from 'react-inspector';
import { getBackgroundScript } from '../common/helpers';
import { experimentArms, feedbackUiVariants } from './consts';

function log(...args) {
	return;
	console.log('[debug page]', ...args);
}

function useAuthSubscription() {
	const [hasAuth, setAuth] = React.useState(false);
	const [events, setEvents] = React.useState([] as Array<ProcessedEvent>);
	React.useEffect(() => {
		async function update() {
			const { authRecorded, events: bevents } = await getBackgroundScript();
			setAuth(authRecorded);
			setEvents(bevents);
		}
		browser.runtime.onMessage.addListener(async (message: Message) => {
			log('message received', message);
			update();
		});
		update();
	}, [setAuth]);
	return [hasAuth, events] as const;
}

function StatusSpan(props: { good: boolean }) {
	return <span style={{ color: props.good ? 'green' : 'red' }}>{props.good ? 'recorded' : 'missing'}</span>;
}

type ColumnDef = {
	title: string;
	id: string;
	name: string;
	views: string;
	length: string;
	'channel.title': string;
	'channel.url': string;
	seenAt: Date;
	tokens: {
		notInterested?: string;
		dontRecommend?: string;
	};
};

const columns: Column<ColumnDef>[] = [
	{ Header: 'ID', accessor: 'id' as any },
	{ Header: 'Time', accessor: 'timestamp' as any, Cell: ({ value }) => value.toUTCString() },
	{ Header: 'Type', accessor: 'type' as any },
	{ Header: 'Subtype', accessor: 'subtype' as any },
	{ Header: 'Counter', accessor: 'counter' as any },
	{ Header: 'Tab ID', accessor: 'tabId' as any },
	{
		Header: 'Payload',
		accessor: 'payload' as any,
		Cell: ({ value }) => {
			if (!value) return null;
			const { tokens, ...rest } = value;
			return <Inspector data={rest} />;
		},
	},
];

function Table({ columns, data, onSelectionChange }: any) {
	const {
		getTableProps,
		getTableBodyProps,
		headerGroups,
		page,
		prepareRow,
		gotoPage,
		previousPage,
		nextPage,
		canNextPage,
		pageCount,
		rowsById,
		state: { pageIndex, pageSize, rowId },
		pageOptions,
		setPageSize,
		canGotoPage,
		canPreviousPage,
		dispatch,
	} = useTable(
		{
			stateReducer: (newState, action) =>
				action.type === 'selection'
					? {
							...newState,
							rowId: action.rowId,
					  }
					: newState,
			columns,
			data,
			initialState: { pageSize: 10 } as any,
		},
		usePagination,
		(hooks) => {
			hooks.visibleColumns.push((columns) => [
				// Let's make a column for selection
				{
					id: 'selection',
					// The cell can use the individual row's getToggleRowSelectedProps method
					// to the render a checkbox
					Cell: ({ row, state }: any) => {
						return (
							<div>
								<input
									type="radio"
									checked={row.id === state.rowId}
									onClick={() => {
										dispatch({ type: 'selection', rowId: row.id });
									}}
								/>
							</div>
						);
					},
				},
				...columns,
			]);
		},
	) as any;

	useEffect(() => {
		onSelectionChange(rowsById[rowId]?.original);
	}, [rowId]);
	// Render the UI for your table
	return (
		<div>
			<table {...getTableProps()} className="table-auto border-t text-xs">
				<thead>
					{headerGroups.map((headerGroup) => (
						<tr {...headerGroup.getHeaderGroupProps()} className="border-b border-r">
							{headerGroup.headers.map((column) => (
								<th {...column.getHeaderProps()} className="border-l">
									{column.render('Header')}
								</th>
							))}
						</tr>
					))}
				</thead>
				<tbody {...getTableBodyProps()}>
					{page.map((row, i) => {
						prepareRow(row);
						return (
							<tr
								{...row.getRowProps()}
								className="border-b border-r border-black hover:bg-blue-20"
								onClick={() => dispatch({ type: 'selection', rowId: row.id })}
							>
								{row.cells.map((cell) => {
									return (
										<td className="border-l px-3" {...cell.getCellProps()}>
											{cell.render('Cell')}
										</td>
									);
								})}
							</tr>
						);
					})}
				</tbody>
			</table>
			<Pagination
				gotoPage={gotoPage}
				previousPage={previousPage}
				nextPage={nextPage}
				canNextPage={canNextPage}
				pageCount={pageCount}
				pageIndex={pageIndex}
				pageOptions={pageOptions}
				pageSize={pageSize}
				setPageSize={setPageSize}
				canGotoPage={canGotoPage}
				canPreviousPage={canPreviousPage}
			/>
		</div>
	);
}

function FeedbackVariantPicker() {
	const [value, setValue] = React.useState<FeedbackUiVariant | void>();
	useEffect(() => {
		feedbackUiVariant.acquire().then((v) => setValue(v));
	}, []);
	const updateVariant: React.ChangeEventHandler<HTMLSelectElement> = useCallback(
		async (event) => {
			const variant = event.target.value as any;
			const bg = await getBackgroundScript();
			await bg.updateFeedbackUiVariant(variant);
			setValue(variant);
		},
		[setValue],
	);
	return (
		<select value={value as any} onChange={updateVariant} className="border border-blue-50">
			{Object.entries(feedbackUiVariants).map(([k, v]) => {
				return (
					<option key={k} value={k}>
						{v}
					</option>
				);
			})}
		</select>
	);
}

function ExperimentArmPicker() {
	const [value, setValue] = React.useState<ExperimentArm | void>();
	useEffect(() => {
		experimentArm.acquire().then((v) => setValue(v));
	}, []);
	const updateCohort: React.ChangeEventHandler<HTMLSelectElement> = useCallback(
		async (event) => {
			const arm = event.target.value as any;
			const bg = await getBackgroundScript();
			await bg.updateExperimentArm(arm);
			setValue(arm);
		},
		[setValue],
	);
	return (
		<select value={value as any} onChange={updateCohort} className="border border-blue-50">
			{Object.entries(experimentArms).map(([k, v]) => {
				return (
					<option key={k} value={k}>
						{v}
					</option>
				);
			})}
		</select>
	);
}

export const App = () => {
	const [selection, setSelection] = useState(null);
	const {
		id: videoId,
		tokens: { notInterested: feedbackTokenNotInterested, dontRecommend: feedbackTokenNoRecommend },
	}: ProcessedVideoData = selection?.payload || { tokens: {} };

	const tabId = selection?.tabId;

	const onDislike = useCallback(() => {
		dispatchSendFeedbackEvent({
			videoId,
			tabId,
		});
	}, [selection]);

	const onFeedback = useCallback(() => {
		dispatchSendFeedbackEvent({
			videoId,
			tabId,
			feedbackTokenNoRecommend,
			feedbackTokenNotInterested,
		});
	}, [selection]);

	const installationIdValue = installationId.use();
	const [hasAuth, events] = useAuthSubscription();

	const onExport = useCallback(() => {
		const data = JSON.stringify(events);

		const url = URL.createObjectURL(
			new Blob([data], {
				type: 'application/json',
			}),
		);
		browser.tabs.create({ url });
	}, [events]);

	return (
		<div className="p-2">
			<div className="">
				<h1 className="text-2xl">Extension state:</h1>
				<div>
					<span className="font-bold">Authorization token: </span>
					<StatusSpan good={hasAuth} />
				</div>
				<div>
					<span className="font-bold">Installation Id: </span>
					{installationIdValue}
				</div>
				<div>
					<span className="font-bold">Experiment Arm: </span>
					<ExperimentArmPicker />
				</div>
				<div>
					<span className="font-bold">Feedback UI Variant: </span>
					<FeedbackVariantPicker />
				</div>
			</div>

			<div className="mt-4">
				<div>
					<h1 className="text-2xl">Event history:</h1>
					<div className="mb-2">
						<button className="button mr-2" onClick={onDislike} disabled={!videoId}>
							Dislike
						</button>
						<button className="button mr-2" onClick={onFeedback} disabled={!feedbackTokenNoRecommend}>
							Don&apos;t Recommend
						</button>
						<button className="button mr-2" onClick={onFeedback} disabled={!feedbackTokenNotInterested}>
							Not Interested
						</button>
						<button className="button ml-4" onClick={onExport}>
							Export All
						</button>
					</div>
				</div>
				<Table columns={columns} data={events} onSelectionChange={setSelection} />
			</div>
		</div>
	);
};
