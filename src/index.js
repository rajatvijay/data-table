import "./styles.css";

let tableData = [];

const config = {
  sortableColumns: ["name"],
  filterableColumns: ["region"],
  headerFixed: true,
  paginated: true
};

const currentTableState = {
  sorting: {
    name: null
  },
  searchString: {
    region: null
  },
  pagination: {
    currentPage: 1
  },
  meta: { loading: false }
};

const enums = {
  SORT_ASCENDING: "SORT_ASCENDING",
  SORT_DESCENDING: "SORT_DESCENDING",
  PAGE_SIZE: 4,
  MAX_PAGE_NOS: 5
};

const getTableData = () => {
  currentTableState.meta.loading = true;
  return fetch("https://restcountries.eu/rest/v2/all")
    .then(res => res.json())
    .then(res => {
      currentTableState.meta.loading = false;
      tableData = res.map(
        ({ name, region, alpha2Code, alpha3Code, population }) => ({
          name,
          region,
          alpha2Code,
          alpha3Code,
          population
        })
      );
      createOrUpdateTable(tableData);
    })
    .catch(e => {
      currentTableState.meta.loading = false;
      createOrUpdateTable(tableData);
    });
};

const isSortable = columnName => {
  return config.sortableColumns.includes(columnName);
};

const isFilterable = columnName => {
  return config.filterableColumns.includes(columnName);
};

const getColumnsList = tableData => {
  return tableData[0] ? Object.keys(tableData[0]) : [];
};

const capitalizeString = str => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

const getSortingHeaderIcon = columnName => {
  const order = currentTableState.sorting[columnName];
  if (!order) {
    return "&#8597;";
  } else if (order === enums.SORT_ASCENDING) {
    return "&#8593;";
  } else {
    return "&#8595;";
  }
};

const getPaginatedTableData = tableData => {
  const startingCount =
    currentTableState.pagination.currentPage * enums.PAGE_SIZE;
  return tableData.slice(startingCount, startingCount + enums.PAGE_SIZE);
};

const getTotalPages = totalRows => {
  return Math.ceil(totalRows / enums.PAGE_SIZE);
};

const createTable = tableData => {
  const container = document.createElement("div");
  container.setAttribute("id", "data-table-container");

  const table = document.createElement("table");
  container.appendChild(table);

  // Create header
  const columns = getColumnsList(tableData);
  const tableHead = createTableHead(columns);
  table.appendChild(tableHead);

  if (tableData.length) {
    // Creating body
    const paginatedTableData = getPaginatedTableData(tableData);
    const tableBody = createTableBody(paginatedTableData);
    table.appendChild(tableBody);
  } else {
    container.innerText = currentTableState.meta.loading
      ? "Loading..."
      : "No data";
  }

  const pagination = createPagination(tableData.length);
  container.appendChild(pagination);

  return container;
};

const createTableHead = columns => {
  const tableHead = document.createElement("thead");

  // Creating header row
  const headerRow = document.createElement("tr");
  tableHead.appendChild(headerRow);

  // Appeding filters
  const filterRow = createFilterRow(columns);
  tableHead.appendChild(filterRow);

  // Creating each column
  columns.forEach(columnName => {
    const th = document.createElement("th");

    const div = document.createElement("div");

    const textNode = document.createElement("span");
    textNode.innerHTML = capitalizeString(columnName);
    div.appendChild(textNode);

    if (isSortable(columnName)) {
      const sorterNode = document.createElement("span");
      sorterNode.innerHTML = getSortingHeaderIcon(columnName);
      sorterNode.classList.add("sorter");
      sorterNode.addEventListener("click", e => {
        handleSorting(columnName, e);
      });
      div.appendChild(sorterNode);
    }

    th.appendChild(div);

    headerRow.appendChild(th);
  });
  return tableHead;
};

const createTableBody = tableData => {
  const tableBody = document.createElement("tbody");

  tableData.forEach(rowData => {
    const tr = document.createElement("tr");
    tableBody.appendChild(tr);

    Object.values(rowData).forEach(columnData => {
      const td = document.createElement("td");
      td.innerHTML = columnData || "--";
      tr.appendChild(td);
    });
  });

  return tableBody;
};

const createFilterRow = columns => {
  const filterRow = document.createElement("tr");

  // Creating each column
  columns.forEach(columnName => {
    const th = document.createElement("th");

    const div = document.createElement("div");

    if (isFilterable(columnName)) {
      const inputNode = document.createElement("input");
      inputNode.setAttribute("id", `${columnName}-searchInput`);
      if (currentTableState.searchString[columnName]) {
        inputNode.setAttribute(
          "value",
          currentTableState.searchString[columnName]
        );
      }
      inputNode.addEventListener("input", e => {
        handleFiltering(columnName, e.target.value);
      });
      div.appendChild(inputNode);
    }

    th.appendChild(div);

    filterRow.appendChild(th);
  });
  return filterRow;
};

const createPagination = totalRows => {
  const container = document.createElement("div");
  container.classList.add("paginationContainer");

  const ul = document.createElement("ul");
  container.appendChild(ul);

  const totalPages = getTotalPages(totalRows);

  const previousNode = document.createElement("li");
  previousNode.innerHTML = "Previous";
  previousNode.addEventListener("click", e =>
    handlePreviousPagination(totalRows)
  );
  ul.appendChild(previousNode);

  const { currentPage } = currentTableState.pagination;
  const pageStart = currentPage - 2 > 0 ? currentPage - 2 : 1;
  const pageEnd =
    pageStart + enums.MAX_PAGE_NOS <= totalPages
      ? pageStart + enums.MAX_PAGE_NOS
      : totalPages;

  for (let i = pageStart; i < pageEnd; i++) {
    const li = document.createElement("li");
    li.innerHTML = i;
    li.addEventListener("click", e => handlePageChange(i, e));

    if (currentTableState.pagination.currentPage === i) {
      li.classList.add("currentPageNo");
    }

    ul.appendChild(li);
  }

  if (pageEnd < totalPages) {
    const li = document.createElement("li");
    li.innerHTML = "....";
    li.classList.add("moreIndicator");
    ul.appendChild(li);
  }

  const nextNode = document.createElement("li");
  nextNode.innerHTML = "Next";
  nextNode.addEventListener("click", e => handleNextPagination(totalRows));
  ul.appendChild(nextNode);

  return container;
};

const getSorteddData = tableData => {
  const sortersApplied = currentTableState.sorting;

  const sortedTableData = [...tableData];
  Object.keys(sortersApplied).forEach(columnName => {
    const currentOrder = currentTableState.sorting[columnName];
    if (!currentOrder) {
      sortedTableData.sort((item1, item2) => {
        return item1[columnName] > item2[columnName];
      });
    } else if (currentOrder === enums.SORT_ASCENDING) {
      sortedTableData.sort((item1, item2) => {
        return item1[columnName] < item2[columnName];
      });
    }
  });
  return sortedTableData;
};

const getFilteredData = tableData => {
  const filtersApplied = currentTableState.searchString;

  let filteredData = tableData;
  Object.keys(filtersApplied).forEach(columnName => {
    const currentSearchString = currentTableState.searchString[columnName];
    if (currentSearchString) {
      filteredData = filteredData.filter(item =>
        String(item[columnName])
          .toLowerCase()
          .includes(currentTableState.searchString[columnName])
      );
    }
  });

  return filteredData;
};

const handleSorting = columnName => {
  const currentOrder = currentTableState.sorting[columnName];

  if (!currentOrder) {
    currentTableState.sorting[columnName] = enums.SORT_ASCENDING;
  } else if (currentOrder === enums.SORT_ASCENDING) {
    currentTableState.sorting[columnName] = enums.SORT_DESCENDING;
  } else {
    currentTableState.sorting[columnName] = null;
  }

  currentTableState.pagination.currentPage = 1;

  applyFilters();
};

const handleFiltering = (columnName, searchString) => {
  const normalizedSearchString = searchString.trim().toLowerCase();

  if (normalizedSearchString && normalizedSearchString.length < 3) {
    return;
  }

  currentTableState.searchString[columnName] = normalizedSearchString;
  currentTableState.pagination.currentPage = 1;
  applyFilters();
};

const handlePreviousPagination = totalRows => {
  if (currentTableState.pagination.currentPage === 1) {
    return;
  }
  currentTableState.pagination.currentPage -= 1;
  applyFilters();
};

const handleNextPagination = totalRows => {
  const maxPageNo = getTotalPages(totalRows);
  if (currentTableState.pagination.currentPage === maxPageNo - 1) {
    return;
  }
  currentTableState.pagination.currentPage += 1;
  applyFilters();
};

const handlePageChange = page => {
  currentTableState.pagination.currentPage = page;
  applyFilters();
};

const applyFilters = () => {
  const sortedTableData = getSorteddData(tableData);
  const filteredTableData = getFilteredData(sortedTableData);
  createOrUpdateTable(filteredTableData);
};

const createOrUpdateTable = updateTableData => {
  const updatedTable = createTable(updateTableData);
  const root = document.getElementById("app");
  const staleTable = document.getElementById("data-table-container");
  if (staleTable) {
    root.replaceChild(updatedTable, staleTable);
  } else {
    root.appendChild(updatedTable);
  }
};

getTableData();
createOrUpdateTable(tableData);
