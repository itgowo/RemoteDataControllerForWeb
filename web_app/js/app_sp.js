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
    var columnData = result.tableData.tableDatas;
    for (var i = 0; i < columnHeader.length; i++) {
      columnHeader[i]['targets'] = i;
      columnHeader[i]['data'] = function (data, type, val, meta) {
        return data[meta.col].value;
      }
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
      availableButtons = [
        {
          text: '添加',
          name: 'add' // don not change name
        },
        {
          extend: 'selected', // Bind to Selected row
          text: '编辑',
          name: 'edit'        // do not change name
        },
        {
          extend: 'selected',
          text: '删除',
          name: 'delete'
        }
      ];
    }
    var changecolumnData = []
    for (var i = 0; i < columnData.length; i++) {
      changecolumnData[i] = columnData[i].map(function (item, index) {
        return item = {value: item, dataType: columnHeader[index].dataType}
      })
    }

    $(tableId).dataTable({
      "columnDefs": columnHeader,
      "data": changecolumnData,
      language: tableLanguage,
      select: 'single',
      searching: false,
      altEditor: true,     // Enable altEditor
      "dom": "Bfrtip",
      buttons: availableButtons,
      onEditRow: function (datatable, rowdata, success, error) {
        console.info('in TABLE 2');

        sp_update(rowdata, success)
      }
    })

    $(tableId).on('delete-row.dt', function (e, deleteRowData, callback) {
        var deleteRowDataArray = JSON.parse(deleteRowData);
        sp_delete(deleteRowDataArray, callback);
      }
    );

    $(tableId).on('add-row.dt', function (e, addRowData, callback) {
      var addRowDataArray = JSON.parse(addRowData);
      sp_addData(addRowDataArray, callback);
    });

    // hack to fix alignment issue when scrollX is enabled
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


function sp_update(updatedData, callback) {
  var requestParameters = {};
  requestParameters.action = "updateDataToSp"
  requestParameters.spFileName = SPFileName;
  requestParameters.RowDataRequests = updatedData;
  $.ajax({
    url: rootUrlWithUrlParam,
    type: 'POST',
    data: JSON.stringify(requestParameters),
    success: function (response) {
      if (response.code == 200) {
        callback(true);
        showSuccessInfo("数据更新成功");
      } else {
        showErrorInfo(response.msg)
        callback(false);
      }
    }
  })
}

function sp_delete(updatedData, callback) {
  var requestParameters = {};
  requestParameters.action = "deleteDataFromSp"
  requestParameters.spFileName = SPFileName;
  requestParameters.RowDataRequests = updatedData;
  $.ajax({
    url: rootUrlWithUrlParam,
    type: 'POST',
    data: JSON.stringify(requestParameters),
    success: function (response) {
      if (response.code == 200) {
        callback(true);
        showSuccessInfo("数据删除成功");
      } else {
        showErrorInfo(response.msg)
        callback(false);
      }
    }
  })
}

function sp_addData(updatedData, callback) {
  var requestParameters = {};
  requestParameters.action = "addDataToSp"
  requestParameters.spFileName = SPFileName;
  requestParameters.RowDataRequests = updatedData;
  $.ajax({
    url: rootUrlWithUrlParam,
    type: 'POST',
    data: JSON.stringify(requestParameters),
    success: function (response) {
      if (response.code == 200) {
        callback(true);
        showSuccessInfo("数据添加成功");
        getDataFromSp(requestParameters.spFileName, "");
      } else {
        showErrorInfo(response.msg)
        callback(false);
      }
    }
  })
}
