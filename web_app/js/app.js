//管理页面主类API，包含通用API

var rootUrl = "";
var rootUrlWithUrlParam = "";
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
  $("#ClientToken").keydown(function (e) {
    if (e.keyCode == 13) {
      login();
    }
  });
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
    if (e.keyCode == 13) {
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
