import * as React from 'react';

function Pagination({
	gotoPage,
	previousPage,
	nextPage,
	canNextPage,
	pageCount,
	pageIndex,
	pageOptions,
	pageSize,
	setPageSize,
	canGotoPage,
	canPreviousPage,
}: any) {
	return (
		<div className="mt-2 flex-row">
			<button className="button" onClick={() => gotoPage(0)} disabled={!canPreviousPage}>
				{'<<'}
			</button>{' '}
			<button className="button ml-4" onClick={() => previousPage()} disabled={!canPreviousPage}>
				{'<'}
			</button>{' '}
			<button className="button ml-1" onClick={() => nextPage()} disabled={!canNextPage}>
				{'>'}
			</button>{' '}
			<button className="button ml-4" onClick={() => gotoPage(pageCount - 1)} disabled={!canNextPage}>
				{'>>'}
			</button>{' '}
			<span>
				Page{' '}
				<strong>
					{pageIndex + 1} of {pageOptions.length}
				</strong>{' '}
			</span>
			<select
				className="border border-blue-50"
				value={pageSize}
				onChange={(e) => {
					setPageSize(Number(e.target.value));
				}}
			>
				{[5, 10, 20, 30, 40, 50].map((pageSize) => (
					<option key={pageSize} value={pageSize}>
						Show {pageSize}
					</option>
				))}
			</select>
		</div>
	);
}

export default Pagination;
