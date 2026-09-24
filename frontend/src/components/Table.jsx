import { Row, Col, Pagination } from "react-bootstrap";
import BTable from "react-bootstrap/Table";
import {
  useTable,
  useSortBy,
  usePagination,
  useGlobalFilter,
} from "react-table";
import { useNavigate } from "react-router-dom";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import { useEffect, useState } from "react";
import "../../src/css/reusableTable.css";


export function Table({
  columns,
  data,
  setPageno,
  pagecount,
  show,
  pageno,
  color = "#111827",
}) {
  const navigate = useNavigate();
  const [pagenumber, setPagenumber] = useState(1);

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    prepareRow,
    page,
    canPreviousPage,
    canNextPage,
    pageCount,
    gotoPage,
    nextPage,
    previousPage,
    state: { pageIndex },
  } = useTable(
    {
      columns,
      data,
      initialState: { pageIndex: pageno ? pageno - 1 : 0, pageSize: 10 },
    },
    useGlobalFilter,
    useSortBy,
    usePagination
  );

  useEffect(() => {
    setPagenumber(pageIndex + 1);
  }, [pageIndex]);

  // FIX: this used to depend on [data, gotoPage]. react-table recreates
  // `gotoPage` with a new identity on every render where its internal
  // pagination state changes — including the render caused by clicking
  // Next/Previous themselves. That meant: click Next -> pageIndex updates
  // -> component re-renders -> gotoPage gets a new reference -> this
  // effect sees a "changed dependency" and fires again -> calls
  // gotoPage(0) -> immediately snaps back to page 1.
  //
  // `gotoPage` is intentionally omitted from the dependency array — it's
  // stable enough to call from inside the effect without needing to
  // react to its own identity changing. The reset should only fire when
  // the actual dataset changes. (No eslint-disable comment needed here —
  // this project's ESLint config doesn't have the react-hooks plugin's
  // exhaustive-deps rule registered, so referencing it in a disable
  // comment errors with "Definition for rule ... was not found" and
  // breaks the build entirely.)
  useEffect(() => {
    gotoPage(0);
  }, [data]);

  const totalPages = Math.ceil((data?.length || 0) / 10);
  const isServerPaginated = Boolean(pagecount);

  // FIX: this branch renders whenever a parent passes `pagecount`
  // (server-side paging, e.g. AdminProductsPage). But `setPageno` is a
  // *separate* prop — a parent can pass `pagecount` without also passing
  // `setPageno` (or pass it as undefined), and every arrow/input in this
  // branch called setPageno(...) completely unguarded, crashing with
  // "setPageno is not a function" the moment it was clicked. Wrapped in
  // a small helper so every call site here is safe regardless of what
  // the parent actually provided.
  const safeSetPageno = (next) => {
    if (typeof setPageno === "function") {
      setPageno(next);
    } else {
      console.warn(
        "Table: pagecount was provided but setPageno was not — pagination cannot change pages. Pass a setPageno handler from the parent component."
      );
    }
  };

  

  return (
    <div className="rt-wrapper">
      <div className="rt-table-scroll">

        <BTable responsive {...getTableProps()} className="rt-table">
          <thead className="rt-thead">
            {headerGroups.map((headerGroup, ind) => (
              <tr className="rt-header-row" {...headerGroup.getHeaderGroupProps()} key={ind}>
                {headerGroup.headers.map((column, indx) => (
                  <th
                    className="rt-th"
                    {...column.getHeaderProps(column.getSortByToggleProps())}
                    key={indx}
                  >
                    <span className="rt-th-label">{column.render("Header")}</span>
                    {column.isSorted && (
                      <span className={`rt-sort-icon ${column.isSortedDesc ? "desc" : "asc"}`} />
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>

          <tbody {...getTableBodyProps()}>
            {page.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="rt-empty">
                  No data available
                </td>
              </tr>
            ) : (
              page.map((row, i) => {
                prepareRow(row);
                return (
                  <tr className="rt-row" {...row.getRowProps()} key={i}>
                    {row.cells.map((cell, ind) => (
                      <td
                        className="rt-cell"
                        style={{ color }}
                        {...cell.getCellProps()}
                        key={ind}
                      >
                        {cell.render("Cell")}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </BTable>
      </div>

      {show && isServerPaginated && (
        <Row className="rt-pagination-bar">
          <Col>
            <div className="rt-pagination-inner">
              <div className="rt-pagination-group">
                <p className="rt-pagination-label">Total Pages</p>
                <input
                  type="number"
                  className="rt-page-display"
                  value={pagecount?.last_page}
                  disabled
                />
              </div>

              <div className="rt-pagination-group">
                <p className="rt-pagination-label">Page No</p>
                <Pagination className="rt-pagination-controls">
                  <PlayArrowIcon
                    className="rt-arrow rt-arrow-left"
                    onClick={() => {
                      safeSetPageno(
                        pagecount?.current_page === 1
                          ? pagecount?.current_page
                          : pagecount?.current_page - 1
                      );
                    }}
                  />
                  <input
                    type="number"
                    value={pagecount?.current_page}
                    min={1}
                    max={pagecount?.last_page}
                    onChange={(e) => {
                      const page = Number(e.target.value);

                      if (page >= 1 && page <= pagecount.last_page) {
                        safeSetPageno(page);
                      }
                    }}
                  />
                  <PlayArrowIcon
                    className="rt-arrow rt-arrow-right"
                    onClick={() => {
                      safeSetPageno(
                        pagecount?.current_page === pagecount?.last_page
                          ? pagecount?.last_page
                          : pagecount?.current_page + 1
                      );
                    }}
                  />
                </Pagination>
              </div>
            </div>
          </Col>
        </Row>
      )}

      {show && !isServerPaginated && (
        <Row className="rt-pagination-bar">
          <Col className="rt-pagination-group">
            <p className="rt-pagination-label">Total Pages</p>
            <input
              type="number"
              className="rt-page-display"
              value={totalPages || 1}
              disabled
            />
          </Col>

          <Col className="rt-pagination-group rt-pagination-group-end">
            <p className="rt-pagination-label">Page No</p>
            <Pagination className="rt-pagination-controls">
              <PlayArrowIcon
                className={`rt-arrow rt-arrow-left ${!canPreviousPage ? "disabled" : ""}`}
                onClick={() => {
                  if (!canPreviousPage) return;
                  previousPage();
                  if (typeof setPageno === "function") {
                    setPageno(pageno - 1);
                  }
                }}
              />
              <input
                type="number"
                className="rt-page-input"
                value={pagenumber}
                onChange={(e) => {
                  if (!Number(e.target.value)) {
                    setPagenumber(e.target.value);
                    return;
                  }
                  if (e.target.value > pageCount) {
                    gotoPage(pageCount - 1);
                    setPagenumber(pageCount);
                    return;
                  }
                  const targetPage = e.target.value ? Number(e.target.value) - 1 : 0;
                  gotoPage(targetPage);
                  setPagenumber(e.target.value);
                }}
              />
              <PlayArrowIcon
                className={`rt-arrow rt-arrow-right ${!canNextPage ? "disabled" : ""}`}
                onClick={() => {
                  if (!canNextPage) return;
                  nextPage();
                  if (typeof setPageno === "function") {
                    setPageno(pageno + 1);
                  }
                }}
              />
            </Pagination>
          </Col>
        </Row>
      )}
    </div>
  );
}
