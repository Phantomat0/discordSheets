const { SheetError, DatabaseError } = require("./errors");

class SpreadSheet {
  constructor(google, oAuth2Client, sheetID) {
    (this._google = google), (this._oAuth2Client = oAuth2Client);
    this._sheetID = sheetID;
  }

  getSheet() {
    return this._google.sheets({ version: "v4", auth: this._oAuth2Client });
  }

  getSheetValues() {
    return this.getSheet().spreadsheets.values;
  }

  #filterData(dataArray, filterQueryObj) {
    const invalidFilterQuery =
      Object.keys(filterQueryObj).find((key) => {
        return !dataArray[0].hasOwnProperty(key);
      }) ?? null;

    if (invalidFilterQuery !== null)
      throw new SheetError(
        "Filter Error",
        `Invalid filter query ${invalidFilterQuery}`
      );

    // Google sheets API always returns strings, so only ==
    const filteredData = dataArray.filter((dataObj) => {
      return Object.entries(filterQueryObj).every(([key, paramObj]) => {
        // If the param has arraySearch option
        if (paramObj?.isArraySearch) {
          return JSON.parse(dataObj[key]).some((val) => val == paramObj.value);
        }

        return (
          dataObj[key]?.toLowerCase() == paramObj.value.toString().toLowerCase()
        );
      });
    });

    const filterParamsStr = Object.entries(filterQueryObj)
      .map(([key, paramObj]) => {
        return `${key}: ${paramObj.value}`;
      })
      .join(", ");

    return {
      data: filteredData,
      params: filterParamsStr,
    };
  }

  async #getHeaders({ range }) {
    const response = await this.getSheetValues().get({
      spreadsheetId: this._sheetID,
      range: range,
    });

    const { data } = response;

    // Sheet is empty
    if (!data.hasOwnProperty("values"))
      throw new SheetError("listMany", `Range: ${data.range} is empty`);

    const [tableHeaders] = data.values;

    return tableHeaders;
  }

  async findOne({ range }, filterQueryObj, enforceOne = true) {
    const getData = async () => {
      try {
        return await this.findMany({ range }, filterQueryObj);
      } catch (error) {
        if (error?.type) return error.handleError();
        console.log(error);
        return null;
      }
    };

    const data = await getData();

    if (data === null && enforceOne)
      throw new DatabaseError(
        `findOne`,
        `[${JSON.stringify(filterQueryObj)}] does not exist`
      );

    if (data.length > 1 && enforceOne)
      throw new DatabaseError(
        `findOne`,
        `Multiple [${JSON.stringify(filterQueryObj)}] exist`
      );

    return data[0] ?? null;
  }

  async findMany({ range }, filterQueryObj) {
    try {
      const dataArray = await this.listMany({ range });

      if (dataArray === null)
        throw new SheetError(
          "findMany Filter Error",
          "dataArray returned null"
        );

      if (dataArray.length === 0) return [];

      const { data: filteredData } = this.#filterData(
        dataArray,
        filterQueryObj
      );

      return filteredData;
    } catch (error) {
      if (error?.type) return error.handleError();
      console.log(error);
      return null;
    }
  }

  async findOneAndUpdate(sheet, valueArray, filterQueryObj, updateQuery) {
    let rowToUpdate = null;

    const determineRange = async () => {
      const { range, name } = sheet;

      // If we supply a range in updateQuery, we dont have to search
      if (updateQuery.hasOwnProperty("range")) {
        return `${name}!${updateQuery.range}`;
      } else {
        try {
          if (!updateQuery.hasOwnProperty("header"))
            throw new SheetError(
              `UpdateOne Error`,
              "No header provided in updateQuery"
            );

          const dataArray = await this.listMany({ range });

          if (dataArray === null)
            throw new SheetError(
              "updateOne",
              "dataArray returned null from listMany"
            );

          const { data: filteredData, params } = this.#filterData(
            dataArray,
            filterQueryObj
          );

          if (filteredData.length > 1)
            throw new SheetError(
              "Filter Error",
              `findOneAndUpdate found ${filteredData.length} results when using queries: ${params}, when it only accepts one.`
            );

          if (filteredData.length === 0)
            throw new SheetError(
              "Filter Error",
              `findOneAndUpdate found 0 results, using queries: ${params}`
            );

          // Our filtered data will always be an array, since its a findOne, we return the first value
          const [filterResult] = filteredData;

          rowToUpdate = filterResult;

          // Now that we found the row, we need to find the column(s)

          const headers = await this.#getHeaders({ range });

          // Get the index of the header we want to search for
          const { header } = updateQuery;

          const indexOfHeader = headers.indexOf(header);

          const indexOfRow = dataArray.indexOf(filterResult) + 2; // +2 Factor in dataArray has no headers AND Google sheets start at 1 not 0

          // Now that we have our indexes, we have to get them in terms of A, B, C, D

          // Google sheet column names, if you have more columns do AB, AC etc
          const columnNames = [
            "A",
            "B",
            "C",
            "D",
            "E",
            "F",
            "G",
            "H",
            "I",
            "J",
            "K",
            "L",
            "M",
            "N",
            "O",
            "P",
            "Q",
            "R",
            "S",
            "T",
            "U",
            "V",
            "W",
            "X",
            "Y",
            "Z",
          ];

          const columnLetter = columnNames[indexOfHeader];

          return `${name}!${columnLetter}${indexOfRow}`;
        } catch (error) {
          if (error?.type) return error.handleError();
          console.log(error);
          return null;
        }
        // We have to search for the range, by indexing the headers
      }
    };

    const rangeToUpdate = await determineRange();

    if (rangeToUpdate === null) {
      console.log("There was an error, rangeToUpdate is null");
      return null;
    }

    await this.getSheetValues().update({
      spreadsheetId: this._sheetID,
      range: rangeToUpdate,
      valueInputOption: "USER_ENTERED",
      resource: {
        values: [valueArray],
      },
    });

    return rowToUpdate;
  }

  async listOne({ range }) {
    try {
      const data = await this.listMany({ range });
      return data[0];
    } catch (error) {
      if (error.type) return error.handleError();
      console.log(error);
      return null;
    }
  }

  async listMany({ range }) {
    const response = await this.getSheetValues().get({
      spreadsheetId: this._sheetID,
      range: range,
    });

    const { data } = response;

    // Sheet is empty
    if (!data.hasOwnProperty("values"))
      throw new SheetError("listMany", `Range: ${data.range} is empty`);

    const { values } = data;

    // Response values are empty, only tableHeaders
    if (values.length === 1) return [];

    const [tableHeaders, ...tableData] = values;

    // Remove empty rows
    const tableValidValues = tableData.filter(
      (row) => Object.keys(row).length !== 0
    );

    // Format the tableData as an array of objects, with tableHeaders as the keys for each object
    const mappedData = tableValidValues.map((player) => {
      return player.reduce((acc, val, index) => {
        acc[tableHeaders[index]] = val;
        return acc;
      }, {});
    });

    return mappedData;
  }

  async write({ range }, valueArray) {
    await this.getSheetValues().append({
      spreadsheetId: this._sheetID,
      range: range,
      valueInputOption: "USER_ENTERED",
      resource: {
        values: [valueArray],
      },
    });
  }
}

module.exports = SpreadSheet;
