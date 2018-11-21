//文件管理页面
var FilecolumnData;
var table;
var File_Path;
var dirType;
var File_rootPath;

function downloadFile(path) {
  if (rootUrlWithUrlParam.indexOf("?") != -1) {
    window.location = rootUrlWithUrlParam + "&downloadFile=" + path;
  } else {
    window.location = rootUrlWithUrlParam + "?downloadFile=" + path;
  }
}

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
              FilecolumnData[i].fileName = "<div onClick='getFileList(\"" + FilecolumnData[i].path + "\")'> <img src=\"../images/folder.png\"/> <a>" + FilecolumnData[i].fileName + "</a></div>";
            } else {
              FilecolumnData[i].fileName = "<div  onClick='downloadFile(\"" + FilecolumnData[i].path + "\")'> <img src=\"../images/file.png\"/><a>" + FilecolumnData[i].fileName + "</a></div>";
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
                  text: '返回',
                  className: 'btn-default',
                  action: function (e, dt, node, config) {
                    getFileList(File_rootPath);
                  }
                },
                {
                  text: '上传',
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
                },
                {
                  extend: 'collection',
                  text: '导出列表',
                  buttons: [{extend: 'copy', text: '复制到剪贴板'},
                    {extend: 'excel', text: '导出为Excel文件'},
                    {extend: 'csv', text: '导出为CSV文件'},
                    {extend: 'pdf', text: '导出为PDF文件'},
                    {extend: 'print', text: '打印'}]
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
  if (typeof (files) == "undefined" || files.length <= 0) {
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
  if (confirm("是否删除" + path + "?") == true) {
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
}
