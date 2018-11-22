//数据库管理页面API


var dbFileName;//当前操作数据库名称，不包含路径
var currentTableName;//当前操作数据库中表的名称
var downloadFilePath1;//当前操作数据库路径，完整存储位置


function getDataColumnFromDb(fileName, dbtableName) {
  var getData
  currentTableName = dbtableName;
  getData = {
    action: "getDataColumnFromDbTable",
    database: fileName,
    tableName: dbtableName,
  }
  $.ajax({
    type: "POST",
    url: rootUrlWithUrlParam,
    crossDomain: true,
    data: JSON.stringify(getData),
    contentType: "application/json; charset=utf-8",
    dataType: "json",
    success: function (result) {
      inflateDataFromDb(result);
    }
  });
}

function inflateDataFromDb(result) {
  if (result.code == 200) {
    var columnHeader = result.tableData.tableColumns;
    for (var i = 0; i < columnHeader.length; i++) {
      columnHeader[i]['targets'] = i;
      columnHeader[i]['data'] = columnHeader[i].title;
    }
    var tableId = "#db-data";
    if ($.fn.DataTable.isDataTable(tableId)) {
      $(tableId).DataTable().destroy();
    }

    $("#db-data-div").remove();
    $("#parent-data-divdb").append('<div id="db-data-div"><table class="display nowrap" cellpadding="0" border="0" cellspacing="0" width="100%" class="table table-striped table-bordered display" id="db-data"></table></div>');

    var availableButtons = [];
    if (result.editable) {
      availableButtons = getDbTableButtons();
    }

    var table_DB = $(tableId).dataTable({
      columnDefs: columnHeader,
      processing: true,
      serverSide: true,
      responsive: true,
      ajax: function (data, callback, settings) {
        db_getDbDataForServerSide(columnHeader, data, callback, settings);
      },
      language: tableLanguage,
      select: 'single',
      searching: false,
      altEditor: true,     // Enable altEditor
      dom: "BSlrtip",
      lengthMenu:[[10,20,50,100,-1],[10,20,50,100,"全部"]],
      buttons: availableButtons,
      onAddRow: function (datatable, rowdata, success, error) {
        db_addData(convertDataForActionData(columnHeader, rowdata), success, error, JSON.stringify(rowdata));
      },
      onDeleteRow: function (datatable, rowdata, success, error) {
        db_delete(convertDataForActionData(columnHeader, rowdata), success, error);
      },
      onEditRow: function (datatable, rowdata, success, error) {
        db_update(convertDataForActionData(columnHeader, rowdata), success, error, JSON.stringify(rowdata));
      }
    })
    $(".dataTables_scrollHeadInner").css({"width": "100%"});
    $(".table ").css({"width": "100%"});
    showSuccessInfo(result.msg);
  } else {
    showErrorInfo(result.msg);
  }
}


// 从数据库拿数据局，不分页
function inflateDataFromDb2(result) {
  if (result.code == 200) {
    showSuccessInfo(result.msg);
    var columnHeader = result.tableData.tableColumns;
    for (var i = 0; i < columnHeader.length; i++) {
      columnHeader[i]['targets'] = i;
      columnHeader[i]['data'] = columnHeader[i].title;
    }
    var tableId = "#db-data";
    if ($.fn.DataTable.isDataTable(tableId)) {
      $(tableId).DataTable().destroy();
    }

    $("#db-data-div").remove();
    $("#parent-data-divdb").append('<div id="db-data-div"><table class="display nowrap" cellpadding="0" border="0" cellspacing="0" width="100%" class="table table-striped table-bordered display" id="db-data"></table></div>');

    var availableButtons = [];
    if (result.editable) {
      availableButtons = getDbTableButtons();
    }
    var data = convertDataForGetData(result, columnHeader);
    $(tableId).dataTable({
      columnDefs: columnHeader,
      data: data.data,
      language: tableLanguage,
      select: 'single',
      serverSide: false,
      altEditor: true,     // Enable altEditor
      dom: "Bfrtip",
      searching: false,
      buttons: availableButtons,
      onAddRow: function (datatable, rowdata, success, error) {
        db_addData(convertDataForActionData(columnHeader, rowdata), success, error, JSON.stringify(rowdata));
      },
      onDeleteRow: function (datatable, rowdata, success, error) {
        db_delete(convertDataForActionData(columnHeader, rowdata), success, error);
      },
      onEditRow: function (datatable, rowdata, success, error) {
        db_update(convertDataForActionData(columnHeader, rowdata), success, error, JSON.stringify(rowdata));
      }
    })
    $(".dataTables_scrollHeadInner").css({"width": "100%"});
    $(".table ").css({"width": "100%"});
  } else {
    showErrorInfo(result.msg);
  }
}

function queryFunction() {
  var query = $('#query').val();
  $.ajax({
    type: "POST",
    crossDomain: true,
    url: rootUrlWithUrlParam,
    data: JSON.stringify({
      action: "query",
      database: dbFileName,
      data: query
    }),
    contentType: "application/json; charset=utf-8",
    dataType: "json",
    success: function (result) {
      inflateDataFromDb2(result);
    }
  });
}

function getDBList() {
  $.ajax({
    type: "POST",
    url: rootUrlWithUrlParam,
    crossDomain: true,
    data: JSON.stringify({action: "getDbList"}),
    contentType: "application/json; charset=utf-8",
    dataType: "json",
    success: function (result) {
      if (result.code == 200) {
        var dbList = result.dbList;
        $('#db-list').empty();
        for (var count = 0; count < dbList.length; count++) {
          $("#db-list").append("<a href='#' id=" + dbList[count].fileName + " class='list-group-item' onClick='openDatabaseAndGetTableList(\"" + dbList[count].fileName + "\",\"" + dbList[count].path + "\")'>" + dbList[count].fileName + "</a>");
        }
        if (dbList.length > 0) {
          openDatabaseAndGetTableList(dbList[0].fileName, dbList[0].path);
        }
      }
    }
  });
}


function openDatabaseAndGetTableList(dbname, path) {
  dbFileName = dbname;
  downloadFilePath1 = path;
  $('#run-query').removeClass('disabled');
  $('#run-query').addClass('active');
  $('#selected-db-info').removeClass('disabled');
  $('#selected-db-info').addClass('active');
  isDatabaseSelected = true;
  $("#selected-db-info").text("点击数据库名称下载 : " + dbname);
  $.ajax({
    type: "POST",
    crossDomain: true,
    url: rootUrlWithUrlParam,
    data: JSON.stringify({
      action: "getTableList",
      database: dbname
    }),
    contentType: "application/json; charset=utf-8",
    dataType: "json",
    success: function (result) {
      if (result.code == 200) {
        var tableList = result.tableList;
        var dbVersion = result.dbVersion;
        $("#selected-db-info").text("点击数据库名称下载 : " + dbname + " Version : " + dbVersion);
        $("#selected-db-info").click(function () {
          downloadFile(downloadFilePath1)
        });
        $('#table-list').empty()
        for (var count = 0; count < tableList.length; count++) {
          $("#table-list").append("<a href='#' data-db-name='" + dbname + "' data-table-name='" + tableList[count] + "' class='list-group-item' onClick='getDataColumnFromDb(\"" + dbname + "\",\"" + tableList[count] + "\");'>" + tableList[count] + "</a>");
        }
      } else {
        showErrorInfo(result.msg);
      }
    }
  });

}

function db_update(actionData, success, error, rowdata) {
  db_DoActionAddOrUpdateOrDelete("updateDataToDb", actionData, success, error, rowdata);
}

function db_delete(deleteData, success, error) {
  db_DoActionAddOrUpdateOrDelete("deleteDataFromDb", deleteData, success, error, true);
}

function db_addData(addData, success, error, rowdata) {
  db_DoActionAddOrUpdateOrDelete("addDataToDb", addData, success, error, rowdata);
}

//数据库数据操作，增删改，封装方法
function db_DoActionAddOrUpdateOrDelete(action, actionData, success, error, rowdata) {
  var requestParameters = {
    action: action,
    database: dbFileName,
    tableName: currentTableName,
    RowDataRequests: actionData
  };
  $.ajax({
    url: rootUrlWithUrlParam,
    type: 'POST',
    contentType: "application/json; charset=utf-8",
    data: JSON.stringify(requestParameters),
    success: function (response) {
      if (response.code == 200) {
        success(rowdata);
      } else {
        error(response);
      }
    },
    error: error
  })
}

//数据请求分页模式
function db_getDbDataForServerSide(columnHeader,data, callback, settings) {
  var param = {};
  param.pageSize = data.length;//页面显示记录条数，在页面显示每页显示多少项的时候
  param.pageIndex = (data.start / data.length) + 1;//开始的记录序号
  param.database = dbFileName;
  param.tableName = currentTableName;
  param.action = "getDataFromDbTable";
  param.draw = data.draw;
  $.ajax({
    type: "POST",
    url: rootUrlWithUrlParam,
    data: JSON.stringify(param), //传入组装的参数
    dataType: "json",
    contentType: 'application/json; charset=utf-8',
    success: function (result) {
      callback(convertDataForGetData(result));
    }
  });
}

//获取数据库数据表格操作按钮
function getDbTableButtons() {
  var availableButtons = [
    {text: '添加', name: 'add'},
    {extend: 'selected', text: '编辑', name: 'edit'},
    {extend: 'selected', text: '删除', name: 'delete'},
    {
      extend: 'collection',
      text: '导出',
      buttons: [{extend: 'copy', text: '复制到剪贴板'},
        {extend: 'excel', text: '导出为Excel文件'},
        {extend: 'csv', text: '导出为CSV文件'},
        {extend: 'pdf', text: '导出为PDF文件'},
        {extend: 'print', text: '打印'}]
    },
    {extend: 'colvis', text: '选择显示列'},
  ];
  return availableButtons;
}