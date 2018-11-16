//共享参数管理页面API

var SPFileName;
var downloadFilePath2;

function getDataFromSp(fileName, tableNameOrPath) {
  var getData
  SPFileName = fileName;
  downloadFilePath2 = tableNameOrPath;
  getData = {
    action: "getDataFromSpFile",
    SPFileName: fileName
  }

  $.ajax({
    type: "POST",
    url: rootUrlWithUrlParam,
    crossDomain: true,
    data: JSON.stringify(getData),
    contentType: "application/json; charset=utf-8",
    dataType: "json",
    success: function (result) {
      inflateDataFromSp(result);
    }
  });
}

// 读取共享参数文件数据不分页，相对数据库来说，存储量级低很多
function inflateDataFromSp(result) {

  if (result.code == 200) {
    var columnHeader = result.tableData.tableColumns;
    for (var i = 0; i < columnHeader.length; i++) {
      columnHeader[i]['targets'] = i;
      columnHeader[i]['data'] = columnHeader[i].title;
    }

    var tableId = "#sp-data";
    $("#selected-sp-info").text("点击文件名称下载 : " + SPFileName);
    $("#selected-sp-info").click(function () {
      downloadFile(downloadFilePath2)
    });
    if (document.getElementById("id")) {
      if ($.fn.DataTable.isDataTable(tableId)) {
        $(tableId).DataTable().destroy();
      }
    }

    $("#sp-data-div").remove();
    $("#parent-data-divsp").append('<div id="sp-data-div"><table class="display nowrap" cellpadding="0" border="0" cellspacing="0" width="100%" class="table table-striped table-bordered display" id="sp-data"></table></div>');

    var availableButtons = [];
    if (result.editable) {
      availableButtons = getSpTableButtons();
    }
    var changecolumnData = convertDataForGetData(result, columnHeader);
    var table_SP = $(tableId).dataTable({
      columnDefs: columnHeader,
      data: changecolumnData.data,
      language: tableLanguage,
      select: 'single',
      searching: false,
      altEditor: true,
      dom: "Bfrtip",
      buttons: availableButtons,
      onAddRow: function (datatable, rowdata, success, error) {
        if (pageindex != 2) {
          return;
        }
        sp_addData(convertDataForActionData(columnHeader, rowdata), success, error, JSON.stringify(rowdata));
      },
      onDeleteRow: function (datatable, rowdata, success, error) {
        if (pageindex != 2) {
          return;
        }
        sp_delete(convertDataForActionData(columnHeader, rowdata), success, error);
      },
      onEditRow: function (datatable, rowdata, success, error) {
        if (pageindex != 2) {
          return;
        }
        sp_update(convertDataForActionData(columnHeader, rowdata), success, error, JSON.stringify(rowdata));
      }
    })
    $(".dataTables_scrollHeadInner").css({"width": "100%"});
    $(".table ").css({"width": "100%"});
    showSuccessInfo(result.msg);
  } else {
    showErrorInfo(result.msg);
  }

}


function getSpList() {
  $.ajax({
    type: "POST",
    url: rootUrlWithUrlParam,
    crossDomain: true,
    data: JSON.stringify({action: "getSpList"}),
    contentType: "application/json; charset=utf-8",
    dataType: "json",
    success: function (result) {
      if (result.code == 200) {
        var spList = result.spList;
        $('#sp-list').empty();
        for (var count = 0; count < spList.length; count++) {
          $("#sp-list").append("<a href='#' id=" + spList[count].fileName + " class='list-group-item' onClick='getDataFromSp(\"" + spList[count].fileName + "\",\"" + spList[count].path + "\")'>" + spList[count].fileName + "</a>");
        }
        if (spList.length > 0) {
          getDataFromSp(spList[0].fileName, spList[0].path);
        }
      }
    }
  });
}


function sp_update(actionData, success, error, rowdata) {
  sp_DoActionAddOrUpdateOrDelete("updateDataToSp", actionData, success, error, rowdata);
}

function sp_delete(actionData, success, error) {
  sp_DoActionAddOrUpdateOrDelete("deleteDataFromSp", actionData, success, error, true);
}

function sp_addData(actionData, success, error, rowdata) {
  sp_DoActionAddOrUpdateOrDelete("addDataToSp", actionData, success, error, rowdata);
}

//共享参数数据操作，增删改，封装方法
function sp_DoActionAddOrUpdateOrDelete(action, actionData, success, error, rowdata) {
  var requestParameters = {
    action: action,
    spFileName: SPFileName,
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

//获取共享参数数据表格操作按钮
function getSpTableButtons() {
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
    }
  ];
  return availableButtons;
}