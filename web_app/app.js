var rootUrl = "";
var rootUrlWithUrlParam = "";
var dbFileName;
var currentTableName;
var SPFileName;
var downloadFilePath1;
var downloadFilePath2;
var File_rootPath;
var File_Path;
var dirType;
var tableLanguage = {
  "sProcessing": "处理中...",
  "sLengthMenu": "显示 _MENU_ 项结果",
  "sZeroRecords": "没有匹配结果",
  "sInfo": "显示第 _START_ 至 _END_ 项结果，共 _TOTAL_ 项",
  "sInfoEmpty": "显示第 0 至 0 项结果，共 0 项",
  "sInfoFiltered": "(由 _MAX_ 项结果过滤)",
  "sInfoPostFix": "",
  "sSearch": "搜索:",
  "sUrl": "",
  "sEmptyTable": "表中数据为空",
  "sLoadingRecords": "载入中...",
  "sInfoThousands": ",",
  "oPaginate": {
    "sFirst": "首页",
    "sPrevious": "上页",
    "sNext": "下页",
    "sLast": "末页"
  },
  "oAria": {
    "sSortAscending": ": 以升序排列此列",
    "sSortDescending": ": 以降序排列此列"
  }
};
$(document).ajaxComplete(function (event, xhr, settings) {
  hideLoading();
});
$(document).ajaxError(function (event, xhr, options, exc) {
  hideLoading();
});
$(document).ajaxSend(function (event, xhr, options, exc) {
  showLoading();
});
$(document).ready(function () {
  $.ajax({
    type: "POST",
    crossDomain: true,
    url: rootUrl,
    data: JSON.stringify({
      action: "isRemoteServer",
    }),
    contentType: "application/json; charset=utf-8",
    dataType: "json",
    success: function (result) {
      if (result.code == 200) {
        if (result.data == 'false') {
          $('#rdc_login').hide();
          $('#rdc_layout').show();
          initRDC();
        } else {
          $('#rdc_login').show();
        }
      }
    }
  });
})

function login() {
  var clientId = $('#ClientId').val();
  var clientToken = $('#ClientToken').val();
  if (clientId != "设备ID" & clientToken != "设备验证码") {
    rootUrlWithUrlParam = rootUrl + "/Web?ClientId=" + clientId;
  } else {
    alert("信息不能为空");
    return;
  }
  var json = {
    action: "Auth",
    clientId: clientId,
    data: clientToken
  };
  $.ajax({
    url: rootUrlWithUrlParam,
    type: "POST",
    data: JSON.stringify(json),
    contentType: "application/json",  //缺失会出现URL编码，无法转成json对象
    success: function (result) {
      console.info(result);
      if (result != null) {
        if (result.code == 200) {
          $('#rdc_login').hide();
          $('#rdc_layout').show();
          initRDC();
        } else {
          alert("验证失败:" + result.msg)
        }
      } else {
        alert("验证失败:未返回数据");
      }
    }
  });
}

function initRDC() {
  getDBList();
  $("#query").keypress(function (e) {
    if (e.which == 13) {
      queryFunction();
    }
  });
  $("#dbwindow").show();
  $("#sqlCommand").show();
  $("#spwindow").hide();
  $("#fmwindow").hide();

  $("#btndb").click(function () {
    $("#dbwindow").show();
    $("#sqlCommand").show();
    $("#spwindow").hide();
    $("#fmwindow").hide();
  });
  $("#btnsp").click(function () {
    $("#dbwindow").hide();
    $("#sqlCommand").hide();
    $("#spwindow").show();
    $("#fmwindow").hide();
    if (downloadFilePath2 == null) {
      getSpList();
    }
  });
  $("#btnfm").click(function () {
    $("#dbwindow").hide();
    $("#sqlCommand").hide();
    $("#spwindow").hide();
    $("#fmwindow").show();
    if (File_rootPath == null) {
      getFileList();
    }
  });

  //update currently selected database
  $(document).on("click", "#db-list .list-group-item", function () {
    $("#db-list .list-group-item").each(function () {
      $(this).removeClass('selected');
    });
    $(this).addClass('selected');
  });
  $(document).on("click", "#btnAll>div", function () {
    $("#pane_show>div").each(function () {
      $(this).hide();
    });
    $("#pane_show>div");
  });
  $(document).on("click", "#db-list .list-group-item", function () {
    $("#db-list .list-group-item").each(function () {
      $(this).removeClass('selected');
    });
    $(this).addClass('selected');
  });
  $(document).on("click", "#db-list .list-group-item", function () {
    $("#db-list .list-group-item").each(function () {
      $(this).removeClass('selected');
    });
    $(this).addClass('selected');
  });

  //update currently table database
  $(document).on("click", "#table-list .list-group-item", function () {
    $("#table-list .list-group-item").each(function () {
      $(this).removeClass('selected');
    });
    $(this).addClass('selected');
  });
  hideLoading();
};

var isDatabaseSelected = true;

function getData(fileName, tableNameOrPath, isDB) {
  if (isDB == "true") {
    getDataFromDb(fileName, tableNameOrPath);
  } else {
    getDataFromSp(fileName, tableNameOrPath);
  }
}

function getDataFromDb(fileName, dbtableName) {
  var getData
  currentTableName = dbtableName;
  getData = {
    action: "getDataFromDbTable",
    database: fileName,
    tableName: dbtableName,
    pageIndex: 1,
    pageSize: 10
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


function inflateDataFromDb(result) {
  if (result.code == 200) {
    var columnHeader = result.tableData.tableColumns;
    var columnData = result.tableData.tableDatas;
    for (var i = 0; i < columnHeader.length; i++) {
      columnHeader[i]['targets'] = i;
      columnHeader[i]['data'] = function (data, type, val, meta) {
        return data[meta.col].value;
      }
    }
    var tableId = "#db-data";
    if ($.fn.DataTable.isDataTable(tableId)) {
      $(tableId).DataTable().destroy();
    }

    $("#db-data-div").remove();
    $("#parent-data-divdb").append('<div id="db-data-div"><table class="display nowrap" cellpadding="0" border="0" cellspacing="0" width="100%" class="table table-striped table-bordered display" id="db-data"></table></div>');

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

    // console.info(columnHeader);
    $(tableId).dataTable({
      "columnDefs": columnHeader,
      "processing": true,
      "serverSide": true,
      ajax: function (data, callback, settings) {
        //封装请求参数
        var param = {};
        param.pageSize = data.length;//页面显示记录条数，在页面显示每页显示多少项的时候
        param.pageIndex = (data.start / data.length) + 1;//开始的记录序号
        param.database = dbFileName;
        param.tableName = currentTableName;
        param.action = "getDataFromDbTable";
        param.draw = data.draw;
        //console.log(param);
        //ajax请求数据
        $.ajax({
          type: "POST",
          url: rootUrlWithUrlParam,
          data: JSON.stringify(param), //传入组装的参数
          dataType: "json",
          contentType: 'application/json; charset=utf-8',
          success: function (result) {
            // console.log(result);
            //封装返回数据
            var returnData = {};
            returnData.draw = param.draw;//这里直接自行返回了draw计数器,应该由后台返回
            returnData.recordsTotal = result.tableData.dataCount;//返回数据全部记录
            returnData.recordsFiltered = result.tableData.dataCount;//后台不实现过滤功能，每次查询均视作全部结果
            returnData.data = result.tableData.tableDatas;//返回的数据列表
            for (var i = 0; i < result.tableData.tableDatas.length; i++) {
              returnData.data[i] = result.tableData.tableDatas[i].map(function (item, index) {
                return item = {value: item, dataType: columnHeader[index].dataType}
              })
            }
            // console.log(returnData);
            //调用DataTables提供的callback方法，代表数据已封装完成并传回DataTables进行渲染
            //此时的数据需确保正确无误，异常判断应在执行此回调前自行处理完毕
            callback(returnData);
          }
        });
      },
      language: tableLanguage,
      select: 'single',
      searching: false,
      altEditor: true,     // Enable altEditor
      "dom": "Bfrtip",
      buttons: availableButtons,
    })

    $(tableId).on('update-row.dt', function (e, updatedRowData, callback) {
      var updatedRowDataArray = JSON.parse(updatedRowData);
      var data = columnHeader;
      for (var i = 0; i < data.length; i++) {
        data[i].value = updatedRowDataArray[i].value;
        data[i].dataType = updatedRowDataArray[i].dataType;
      }
      db_update(data, callback);
    });

    $(tableId).on('delete-row.dt', function (e, deleteRowData, callback) {
      var deleteRowDataArray = JSON.parse(deleteRowData);
      var data = columnHeader;
      for (var i = 0; i < data.length; i++) {
        data[i].value = deleteRowDataArray[i].value;
        data[i].dataType = deleteRowDataArray[i].dataType;
      }
      db_delete(data, callback);
    });

    $(tableId).on('add-row.dt', function (e, addRowData, callback) {
      var addRowDataArray = JSON.parse(addRowData);
      var data = columnHeader;
      for (var i = 0; i < data.length; i++) {
        data[i].value = addRowDataArray[i].value;
        data[i].dataType = addRowDataArray[i].dataType;
      }
      db_addData(data, callback);
    });

    // hack to fix alignment issue when scrollX is enabled
    $(".dataTables_scrollHeadInner").css({"width": "100%"});
    $(".table ").css({"width": "100%"});
    showSuccessInfo(result.msg);
  } else {
    showErrorInfo(result.msg);
  }

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
    })

    $(tableId).on('update-row.dt', function (e, updatedRowData, callback) {
      var updatedRowDataArray = JSON.parse(updatedRowData);
      sp_update(updatedRowDataArray, callback)

    });

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

// 从数据库拿数据局，不分页
function inflateDataFromDb2(result) {
  if (result.code == 200) {
    showSuccessInfo(result.msg);
    var columnHeader = result.tableData.tableColumns;
    var columnData = result.tableData.tableDatas;
    for (var i = 0; i < columnHeader.length; i++) {
      columnHeader[i]['targets'] = i;
      columnHeader[i]['data'] = function (data, type, val, meta) {
        return data[meta.col].value;
      }
    }
    var tableId = "#db-data";
    if ($.fn.DataTable.isDataTable(tableId)) {
      $(tableId).DataTable().destroy();
    }

    $("#db-data-div").remove();
    $("#parent-data-divdb").append('<div id="db-data-div"><table class="display nowrap" cellpadding="0" border="0" cellspacing="0" width="100%" class="table table-striped table-bordered display" id="db-data"></table></div>');

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
      altEditor: true,     // Enable altEditor
      "dom": "Bfrtip",
      buttons: availableButtons,
    })

    $(tableId).on('update-row.dt', function (e, updatedRowData, callback) {
      var updatedRowDataArray = JSON.parse(updatedRowData);
      var data = columnHeader;
      for (var i = 0; i < data.length; i++) {
        data[i].value = updatedRowDataArray[i].value;
        data[i].dataType = updatedRowDataArray[i].dataType;
      }
      db_update(data, callback);
    });

    $(tableId).on('delete-row.dt', function (e, deleteRowData, callback) {
      var deleteRowDataArray = JSON.parse(deleteRowData);
      var data = columnHeader;
      for (var i = 0; i < data.length; i++) {
        data[i].value = deleteRowDataArray[i].value;
        data[i].dataType = deleteRowDataArray[i].dataType;
      }
      db_delete(data, callback);
    });

    $(tableId).on('add-row.dt', function (e, addRowData, callback) {
      var addRowDataArray = JSON.parse(addRowData);
      var data = columnHeader;
      for (var i = 0; i < data.length; i++) {
        data[i].value = addRowDataArray[i].value;
        data[i].dataType = addRowDataArray[i].dataType;
      }
      db_addData(data, callback);
    });

    // hack to fix alignment issue when scrollX is enabled
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

function downloadFile(path) {
  if (isDatabaseSelected) {
    if (path.indexOf("/") != -1) {
      window.location = "downloadFile" + path + "?downloadFile=" + path;
    } else {
      window.location = "downloadFile/" + path + "?downloadFile=" + path;
    }
  }
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
        var isSelectionDone = false;
        for (var count = 0; count < dbList.length; count++) {
          $("#db-list").append("<a href='#' id=" + dbList[count].fileName + " class='list-group-item' onClick='openDatabaseAndGetTableList(\"" + dbList[count].fileName + "\",\"" + dbList[count].path + "\")'>" + dbList[count].fileName + "</a>");
        }
        if (!isSelectionDone) {
          isSelectionDone = true;
          $('#db-list').find('a').trigger('click');
        }
      }
    }
  });
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
        var isSelectionDone = false;
        for (var count = 0; count < spList.length; count++) {
          $("#sp-list").append("<a href='#' id=" + spList[count].fileName + " class='list-group-item' onClick='getData(\"" + spList[count].fileName + "\",\"" + spList[count].path + "\",\"" + false + "\")'>" + spList[count].fileName + "</a>");
        }
        if (!isSelectionDone) {
          isSelectionDone = true;
          $('#sp-list').find('a').trigger('click');
        }
      }
    }
  });
}


var FilecolumnData;
var table;

function getFileList(path) {
  var tableId = "#fm-data";
  if (FilecolumnData == null) {
    $("#fm-data-div").remove();
    $("#parent-data-divfm").append('<div id="fm-data-div"><table class="display nowrap" cellpadding="0" border="0" cellspacing="0" width="100%" class="table table-striped table-bordered display" id="fm-data">' + '</table></div>');
    $(tableId).removeClass('display').addClass('table table-striped table-bordered');
  }
  $.ajax({
    type: "POST",
    url: rootUrlWithUrlParam,
    crossDomain: true,
    data: JSON.stringify({
      action: "getFileList",
      "data": path,
      "data1": dirType
    }),
    contentType: "application/json; charset=utf-8",
    dataType: "json",
    success:
      function (result) {
        if (result.code == 200) {
          File_rootPath = result.fileList.parentPath;
          File_Path = result.fileList.path;
          FilecolumnData = result.fileList.fileList;
          for (i = 0; i < FilecolumnData.length; i++) {
            if (FilecolumnData[i].dir == true) {
              FilecolumnData[i].fileName = "<div onClick='getFileList(\"" + FilecolumnData[i].path + "\")'> <img src=\"images/folder.png\"/> <a>" + FilecolumnData[i].fileName + "</a></div>";
            } else {
              FilecolumnData[i].fileName = "<div  onClick='downloadFile(\"" + FilecolumnData[i].path + "\")'> <img src=\"images/file.png\"/><a>" + FilecolumnData[i].fileName + "</a></div>";
            }
            FilecolumnData[i].action = "<div><button class='btn btn-default' onClick='file_delete(\"" + i + "\",\"" + FilecolumnData[i].path + "\")'>删除</button><button class='btn btn-default' style='margin-left: 10px' onClick='file_rename(\"" + i + "\",\"" + FilecolumnData[i].path + "\")'>重命名</button></div>";
          }
          if ($.fn.DataTable.isDataTable(tableId)) {
            $(tableId).DataTable().destroy();
          }
          table = $(tableId).DataTable(
            {
              columns: result.fileList.fileColumns,
              data: FilecolumnData,
              language: tableLanguage,
              select: 'single',
              altEditor: true,
              dom: 'Bfrtip',
              buttons: [
                {
                  text: '返回上级目录',
                  className: 'btn-default',
                  action: function (e, dt, node, config) {
                    getFileList(File_rootPath);
                  }
                },
                {
                  text: '上传文件',
                  className: 'btn-default',
                  action: function (e, dt, node, config) {
                    document.getElementById("uploadFileBtn").click();
                  }
                },
                {
                  text: '新建文件夹',
                  className: 'btn-default',
                  action: function (e, dt, node, config) {
                    makeDir();
                  }
                },
                {
                  text: '切换到内部目录',
                  className: 'btn-default',
                  action: function (e, dt, node, config) {
                    dirType = null;
                    getFileList();
                  }
                },
                {
                  text: '切换到扩展存储',
                  className: 'btn-default',
                  action: function (e, dt, node, config) {
                    dirType = "切换到扩展存储";
                    getFileList();
                  }
                }
              ]
            }
          );
        } else {
          showErrorInfo(result.msg);
        }
      }
  });
}

function file_rename(position, path) {
  var str = prompt("新的文件名，不要添加路径哦！");
  if (str == null) {
    return;
  }
  if (str) {
    $.ajax({
      type: "POST",
      url: rootUrlWithUrlParam,
      crossDomain: true,
      data: JSON.stringify({
        action: "renameFile",
        "data": path,
        "data1": str
      }),
      contentType: "application/json; charset=utf-8",
      dataType: "json",
      success:
        function (result) {
          if (result.code == 200) {
            getFileList(File_Path);
            showSuccessInfo(result.msg);
          } else {
            showErrorInfo(result.msg);
          }
        }
    });
  } else {
    alert("新名字错误")
  }
}

function makeDir() {
  var str = prompt("文件夹名");
  if (str == null) {
    return;
  }
  if (str) {
    $.ajax({
      type: "POST",
      url: rootUrlWithUrlParam,
      crossDomain: true,
      data: JSON.stringify({
        action: "makeDir",
        "data": File_Path + "/" + str
      }),
      contentType: "application/json; charset=utf-8",
      dataType: "json",
      success:
        function (result) {
          if (result.code == 200) {
            getFileList(File_Path);
            showSuccessInfo(result.msg);
          } else {
            showErrorInfo(result.msg);
          }
        }
    });
  } else {
    alert("名称非法")
  }
}

function uploadFile() {

  var files = document.getElementById("uploadFileBtn").files;
  if (typeof (files) == "undefined" || files.size <= 0) {
    alert("请选择图片");
    return;
  }
  // var formFile = new FormData(document.getElementById("uploadFileBtn"));
  var formFile = new FormData();
  formFile.append(files[0].name, files[0]); //加入文件对象
  var filedir;
  if (typeof(File_Path) == "undefined") {
    filedir = "";
  } else {
    filedir = File_Path;
  }
  var url;
  if (rootUrlWithUrlParam.indexOf('?') == -1) {
    url = rootUrlWithUrlParam + "/upload?uploadPath=" + filedir + "&random=" + Math.random();
  } else {
    url = rootUrlWithUrlParam + "&uploadPath=" + filedir + "&random=" + Math.random();
  }
  document.getElementById("uploadFileBtn").value = '';
  $.ajax({
    url: url,
    data: formFile,
    type: "POST",
    cache: false,//上传文件无需缓存
    processData: false,//用于对data参数进行序列化处理 这里必须false
    contentType: false, //必须
    success: function (result) {
      if (result.code == 200) {
        alert("上传完成!");
      } else {
        alert(result.msg);
      }
      getFileList(File_Path);
    },
    error: function (xhr, state, errorThrown) {
      alert("上传失败!" + errorThrown);
    }
  })
}

function file_delete(position, path) {
  $.ajax({
    type: "POST",
    url: rootUrlWithUrlParam,
    crossDomain: true,
    data: JSON.stringify({
      action: "deleteFile",
      "data": path
    }),
    contentType: "application/json; charset=utf-8",
    dataType: "json",
    success:
      function (result) {
        if (result.code == 200) {
          table.rows('.selected')
            .remove()
            .draw();
          showSuccessInfo(result.msg);
        } else {
          showErrorInfo(result.msg);
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
          $("#table-list").append("<a href='#' data-db-name='" + dbname + "' data-table-name='" + tableList[count] + "' class='list-group-item' onClick='getData(\"" + dbname + "\",\"" + tableList[count] + "\",\"" + true + "\");'>" + tableList[count] + "</a>");
        }
      } else {
        showErrorInfo(result.msg);
      }
    }
  });

}

//send update database request to server
function db_update(updatedData, callback) {
  var selectedTableElement = $("#table-list .list-group-item.selected");
  var filteredUpdatedData = updatedData.map(function (columnData) {
    return {
      title: columnData.title,
      isPrimary: columnData.primary,
      value: columnData.value,
      dataType: columnData.dataType
    }
  });
  var requestParameters = {};
  requestParameters.action = "updateDataToDb"
  requestParameters.database = selectedTableElement.attr('data-db-name');
  requestParameters.tableName = selectedTableElement.attr('data-table-name');
  requestParameters.RowDataRequests = filteredUpdatedData
  $.ajax({
    url: rootUrlWithUrlParam,
    type: 'POST',
    data: JSON.stringify(requestParameters),
    success: function (response) {
      if (response.code == 200) {
        callback(true);
        showSuccessInfo("数据更新成功");
        getData(requestParameters.database + "," + requestParameters.tableName);
      } else {
        showErrorInfo(response.msg)
        callback(false);
      }
    }
  })
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
        getData(requestParameters.spFileName, "", false);
      } else {
        showErrorInfo(response.msg)
        callback(false);
      }
    }
  })
}


function db_delete(deleteData, callback) {
  var selectedTableElement = $("#table-list .list-group-item.selected");
  var filteredUpdatedData = deleteData.map(function (columnData) {
    return {
      title: columnData.title,
      isPrimary: columnData.primary,
      value: columnData.value,
      dataType: columnData.dataType
    }
  });
  var requestParameters = {};
  requestParameters.action = "deleteDataFromDb"
  requestParameters.database = selectedTableElement.attr('data-db-name');
  requestParameters.tableName = selectedTableElement.attr('data-table-name');
  requestParameters.RowDataRequests = filteredUpdatedData
  $.ajax({
    url: rootUrlWithUrlParam,
    type: 'POST',
    data: JSON.stringify(requestParameters),
    success: function (response) {
      if (response.code == 200) {
        callback(true);
        getData(requestParameters.database + "," + requestParameters.tableName);
        showSuccessInfo("数据删除成功");
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
        getData(requestParameters.spFileName, "", false);
      } else {
        showErrorInfo(response.msg)
        callback(false);
      }
    }
  })
}

function db_addData(deleteData, callback) {
  var selectedTableElement = $("#table-list .list-group-item.selected");
  var filteredUpdatedData = deleteData.map(function (columnData) {
    return {
      title: columnData.title,
      isPrimary: columnData.primary,
      value: columnData.value,
      dataType: columnData.dataType
    }
  });
  var requestParameters = {
    "action": "addDataToDb",
    "database": "",
    "tableName": "",
  };
  requestParameters.database = selectedTableElement.attr('data-db-name');
  requestParameters.tableName = selectedTableElement.attr('data-table-name');
  requestParameters.RowDataRequests = filteredUpdatedData
  $.ajax({
    url: rootUrlWithUrlParam,
    type: 'POST',
    data: JSON.stringify(requestParameters),
    success: function (response) {
      if (response.code == 200) {
        callback(true);
        getData(requestParameters.database + "," + requestParameters.tableName);
        showSuccessInfo("数据添加成功");
      } else {
        showErrorInfo(response.msg)

        callback(false);
      }
    }
  });
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
        getData(requestParameters.spFileName, "", false);
      } else {
        showErrorInfo(response.msg)
        callback(false);
      }
    }
  })
}

function showSuccessInfo(message) {
  hideLoading();
  var snackbarId = "snackbar";
  var snackbarElement = $("#" + snackbarId);
  snackbarElement.addClass("show");
  snackbarElement.css({"backgroundColor": "#5cb85c"});
  snackbarElement.html(message)
  setTimeout(function () {
    snackbarElement.removeClass("show");
  }, 3000);
}

function showErrorInfo(message) {
  hideLoading();
  var snackbarId = "snackbar";
  var snackbarElement = $("#" + snackbarId);
  snackbarElement.addClass("show");
  snackbarElement.css({"backgroundColor": "#d9534f"});
  snackbarElement.html('')
  snackbarElement.html(message)
  setTimeout(function () {
    snackbarElement.removeClass("show");
  }, 3000);
}

function showLoading() {
  $("#sys-loading").show();
}

function hideLoading() {
  $("#sys-loading").hide();
}
