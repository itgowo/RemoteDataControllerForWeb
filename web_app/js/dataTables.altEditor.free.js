/**
 * @version 2.0.0
 * @author lujianchao(itgowo.com)
 * @Github： https://github.com/itgowo
 * 原作者 https://github.com/KasperOlesen/DataTable-AltEditor
 * 此版本修复了多个DataTables使用时因为创建的事件ID相同而导致多处触发问题；
 * 例如DataTablesA设置了onEditRow事件，对DataTablesB进行操作触发B的onEditRow时，A的onEditRow也会执行，这是一个严重bug，希望大家用多个DataTables的用这个库。
 * 同时添加编辑删除改成了中文，namespace改了，固定id变成了动态id，其他的与原作者一致。
 * 删除了部分注释，感觉多余。没删的是不想删了，消耗卡路里
 */
(function (factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD
    define(['jquery', 'datatables.net'], function ($) {
      return factory($, window, document);
    });
  }
  else if (typeof exports === 'object') {
    // CommonJS
    module.exports = function (root, $) {
      if (!root) {
        root = window;
      }

      if (!$ || !$.fn.dataTable) {
        $ = require('datatables.net')(root, $).$;
      }

      return factory($, root, root.document);
    };
  }
  else {
    // Browser
    factory(jQuery, window, document);
  }
})
(function ($, window, document, undefined) {
  'use strict';
  var DataTable = $.fn.dataTable;

  var _instance = 0;

  /**
   * altEditor provides modal editing of records for Datatables
   *
   * @class altEditor
   * @constructor
   * @param {object}
   *            oTD DataTables settings object
   * @param {object}
   *            oConfig Configuration object for altEditor
   */
  var altEditor = function (dt, opts) {
    if (!DataTable.versionCheck || !DataTable.versionCheck('1.10.8')) {
      throw ("Warning: altEditor requires DataTables 1.10.8 or greater");
    }

    // User and defaults configuration object
    this.c = $.extend(true, {}, DataTable.defaults.altEditor,
      altEditor.defaults, opts);
    this.s = {
      dt: new DataTable.Api(dt),
      namespace: 'altEditor' + (_instance++)
    };

    this.dom = {
      /** @type {jQuery} altEditor handle */
      modal: $('<div class="dt-altEditor-handle"/>'),
    };
    this._constructor();
  }

  $.extend(
    altEditor.prototype,
    {

      _constructor: function () {
        var that = this;
        var dt = this.s.dt;

        if (dt.settings()[0].oInit.onAddRow)
          that.onAddRow = dt.settings()[0].oInit.onAddRow;
        if (dt.settings()[0].oInit.onDeleteRow)
          that.onDeleteRow = dt.settings()[0].oInit.onDeleteRow;
        if (dt.settings()[0].oInit.onEditRow)
          that.onEditRow = dt.settings()[0].oInit.onEditRow;

        this._setup();

        dt.on('destroy.altEditor', function () {
          dt.off('.altEditor');
          $(dt.table().body()).off(that.s.namespace);
          $(document.body).off(that.s.namespace);
        });
      },

      _setup: function () {
        var that = this;
        var dt = this.s.dt;

        var modal = '<div class="modal fade" id="altEditor-modal" tabindex="-1" role="dialog">' +
          '<div class="modal-dialog">' +
          '<div class="modal-content">' +
          '<div class="modal-header">' +
          '<h4 style="padding-top: 1rem;padding-left: 1rem;" class="modal-title"></h4>' +
          '<button style="margin: initial;" type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>' +
          '</div>' +
          '<div class="modal-body">' +
          '<p></p>' +
          '</div>' +
          '<div class="modal-footer">' +
          '<button type="button" class="btn btn-default" data-dismiss="modal">Close</button>' +
          '<input type="submit" form="altEditor-form" class="btn btn-primary"></input>' +
          '</div>' +
          '</div>' +
          '</div>' +
          '</div>';
        // add modal
        $('body').append(modal);

        // add Edit Button
        if (dt.button('edit:name')) {
          dt.button('edit:name').action(function (e, dt, node, config) {
            that._openEditModal();
          });

          $(document).on('click', '#editRowBtn' + this.s.namespace, function (e) {
            if (that._inputValidation()) {
              e.preventDefault();
              e.stopPropagation();
              that._editRowData();
            }
          });
        }

        // add Delete Button
        if (dt.button('delete:name')) {
          dt.button('delete:name').action(function (e, dt, node, config) {
            that._openDeleteModal();
          });

          $(document).on('click', '#deleteRowBtn' + that.s.namespace, function (e) {
            e.preventDefault();
            e.stopPropagation();
            that._deleteRow();
            $(this).prop('disabled', true);
          });
        }

        // add Add Button
        if (dt.button('add:name')) {
          dt.button('add:name').action(function (e, dt, node, config) {
            that._openAddModal();
          });
          $(document).on('click', '#addRowBtn' + this.s.namespace, function (e) {
            console.info("click")
            if (that._inputValidation()) {
              e.preventDefault();
              e.stopPropagation();
              that._addRowData();
            }
          });
        }

        // add Refresh button
        if (this.s.dt.button('refresh:name')) {
          this.s.dt.button('refresh:name').action(function (e, dt, node, config) {
            if (dt.ajax && dt.ajax.url()) {
              dt.ajax.reload();
            }
          });
        }
      },

      /**
       * Emit an event on the DataTable for listeners
       *
       * @param {string}
       *            name Event name
       * @param {array}
       *            args Event arguments
       * @private
       */
      _emitEvent: function (name, args) {
        this.s.dt.iterator('table', function (ctx, i) {
          $(ctx.nTable).triggerHandler(name + '.dt', args);
        });
      },

      /**
       * Open Edit Modal for selected row
       *
       * @private
       */
      _openEditModal: function () {
        var that = this;
        var dt = this.s.dt;
        var columnDefs = [];

        // Adding column attributes to object.
        // Please set the ID as readonly.
        for (var i in dt.context[0].aoColumns) {
          var obj = dt.context[0].aoColumns[i];
          columnDefs[i] = {
            title: obj.sTitle,
            name: obj.data ? obj.data : obj.mData,
            type: (obj.type ? obj.type : 'text'),
            options: (obj.options ? obj.options : []),
            msg: (obj.errorMsg ? obj.errorMsg : ''),
            hoverMsg: (obj.hoverMsg ? obj.hoverMsg : ''),
            pattern: (obj.pattern ? obj.pattern : '.*'),
            special: (obj.special ? obj.special : ''),
            unique: (obj.unique ? obj.unique : false),
            uniqueMsg: (obj.uniqueMsg ? obj.uniqueMsg : ''),
            maxLength: (obj.maxLength ? obj.maxLength : false),
            multiple: (obj.multiple ? obj.multiple : false),
            select2: (obj.select2 ? obj.select2 : false)
          };
        }
        var adata = dt.rows({
          selected: true
        });

        // Building edit-form
        var data = "";

        data += "<form name='altEditor-form' role='form'>";

        for (var j in columnDefs) {
          // handle hidden fields
          if (columnDefs[j].type.indexOf("hidden") >= 0) {
            data += "<input type='hidden' id='" + columnDefs[j].name + "' value='" + adata.data()[0][columnDefs[j].name] + "'></input>";
          }
          else {
            // handle fields that are visible to the user
            data += "<div style='margin-left: initial;margin-right: initial;' class='form-group row'>"
            data += "<div class='col-sm-3 col-md-3 col-lg-3 text-right' style='padding-top:4px;'>"
            data += "<label for='" + columnDefs[j].title + "'>" + columnDefs[j].title + ":</label></div>"
            data += "<div class='col-sm-8 col-md-8 col-lg-8'>";

            // Adding text-inputs and errorlabels
            if (columnDefs[j].type.indexOf("text") >= 0) {
              data += "<input type='"
                + that._quoteattr(columnDefs[j].type)
                + "' id='"
                + that._quoteattr(columnDefs[j].name)
                + "'  pattern='"
                + that._quoteattr(columnDefs[j].pattern)
                + "'  title='"
                + that._quoteattr(columnDefs[j].hoverMsg)
                + "' name='"
                + that._quoteattr(columnDefs[j].title)
                + "' placeholder='"
                + that._quoteattr(columnDefs[j].title)
                + "' data-special='"
                + that._quoteattr(columnDefs[j].special)
                + "' data-errorMsg='"
                + that._quoteattr(columnDefs[j].msg)
                + "' data-uniqueMsg='"
                + that._quoteattr(columnDefs[j].uniqueMsg)
                + "' data-unique='"
                + columnDefs[j].unique
                + "'"
                + (columnDefs[j].maxLength == false ? "" : " maxlength='" + columnDefs[j].maxLength + "'")
                + " style='overflow:hidden'  class='form-control  form-control-sm' value='"
                + that._quoteattr(adata.data()[0][columnDefs[j].name]) + "'>";
              data += "<label id='" + columnDefs[j].name + "label"
                + "' class='errorLabel'></label>";
            }

            // Adding readonly-fields
            if (columnDefs[j].type.indexOf("readonly") >= 0) {
              data += "<input type='text' readonly  id='"
                + columnDefs[j].name
                + "' name='"
                + columnDefs[j].title
                + "' placeholder='"
                + columnDefs[j].title
                + "' style='overflow:hidden'  class='form-control  form-control-sm' value='"
                + adata.data()[0][columnDefs[j].name] + "'>";
            }

            // Adding select-fields
            if (columnDefs[j].type.indexOf("select") >= 0) {
              var options = "";
              for (var i = 0; i < columnDefs[j].options.length; i++) {
                // Assigning the selected value of the <selected> option
                if (adata.data()[0][columnDefs[j].name]
                    .indexOf(columnDefs[j].options[i]) >= 0) {
                  options += "<option value='"
                    + columnDefs[j].options[i] + "'selected>"
                    + columnDefs[j].options[i] + "</option>";
                } else {
                  options += "<option value='"
                    + columnDefs[j].options[i] + "'>"
                    + columnDefs[j].options[i] + "</option>";
                }
              }
              data += "<select class='form-control" + (columnDefs[j].select2 ? ' select2' : '') + "' id='" + columnDefs[j].name + "' name='" + columnDefs[j].title + "' " + (columnDefs[j].multiple ? 'multiple' : '') + ">" + options
                + "</select>";
            }
            data += "</div><div style='clear:both;'></div></div>";

          }
        }
        // close form
        data += "</form>";

        $('#altEditor-modal').on('show.bs.modal', function () {
          var btns = '<button type="button" data-content="remove" class="btn btn-default" data-dismiss="modal">关闭</button>' +
            '<button type="button" data-content="remove" class="btn btn-primary" id="editRowBtn' + that.s.namespace + '" >提交更改</button>';
          $('#altEditor-modal').find('.modal-title').html('编辑记录');
          $('#altEditor-modal').find('.modal-body').html(data);
          $('#altEditor-modal').find('.modal-footer').html(btns);
        });

        $('#altEditor-modal').modal('show');
        $('#altEditor-modal input[0]').focus();

        // enable select 2 items
        for (var j in columnDefs) {
          if (columnDefs[j].select2) {
            $("#altEditor-modal").find("select#" + columnDefs[j].name).select2(columnDefs[j].select2);
          }
        }
      },

      /**
       * Callback for "Edit" button
       */
      _editRowData: function () {
        var that = this;
        var dt = this.s.dt;

        // Complete new row data
        var rowDataArray = {};

        var adata = dt.rows({
          selected: true
        });

        // Getting the inputs from the edit-modal
        $('form[name="altEditor-form"] *').filter(':input').each(function (i) {
          rowDataArray[$(this).attr('id')] = $(this).val();
        });
        that.onEditRow(that,
          rowDataArray,
          function (data, b, c, d, e) {
            that._editRowCallback(data, b, c, d, e);
          },
          function (data) {
            that._errorCallback(data);
          });
      },

      /**
       * Open Delete Modal for selected row
       *
       * @private
       */
      _openDeleteModal: function () {
        var that = this;
        var dt = this.s.dt;
        var columnDefs = [];

        // Adding attribute IDs and values to object
        for (var i in dt.context[0].aoColumns) {
          columnDefs.push({
            title: dt.context[0].aoColumns[i].sTitle,
            type: (dt.context[0].aoColumns[i].type ? dt.context[0].aoColumns[i].type : 'text'),
            name: dt.context[0].aoColumns[i].data ? dt.context[0].aoColumns[i].data : dt.context[0].aoColumns[i].mData
          });
        }
        var adata = dt.rows({
          selected: true
        });

        // Building delete-modal
        var data = "";

        data += "<form name='altEditor-form' role='form'>";
        for (var j in columnDefs) {
          if (columnDefs[j].type.indexOf("hidden") >= 0) {
            data += "<input type='hidden' id='" + columnDefs[j].title + "' value='" + adata.data()[0][columnDefs[j].name] + "'></input>";
          }
          else {
            data += "<div style='margin-left: initial;margin-right: initial;' class='form-group row'><label for='"
              + that._quoteattr(columnDefs[j].title)
              + "'>"
              + columnDefs[j].title
              + ":  </label> <input  type='hidden'  id='"
              + that._quoteattr(columnDefs[j].title)
              + "' name='"
              + that._quoteattr(columnDefs[j].title)
              + "' placeholder='"
              + that._quoteattr(columnDefs[j].title)
              + "' style='overflow:hidden'  class='form-control' value='"
              + that._quoteattr(adata.data()[0][columnDefs[j].name]) + "' >"
              + adata.data()[0][columnDefs[j].name]
              + "</input></div>";
          }
        }
        // close the form
        data += "</form>";

        $('#altEditor-modal').on('show.bs.modal', function () {
          var btns = '<button type="button" data-content="remove" class="btn btn-default" data-dismiss="modal">关闭</button>' +
            '<button type="button"  data-content="remove" class="btn btn-danger"  id="deleteRowBtn' + that.s.namespace + '">删除</button>';
          $('#altEditor-modal').find('.modal-title').html('删除记录');
          $('#altEditor-modal').find('.modal-body').html(data);
          $('#altEditor-modal').find('.modal-footer').html(btns);
        });

        $('#altEditor-modal').modal('show');
        $('#altEditor-modal input[0]').focus();
      },

      /**
       * Callback for "Delete" button
       */
      _deleteRow: function () {
        var that = this;
        var dt = this.s.dt;

        var jsonDataArray = {};

        var adata = dt.rows({
          selected: true
        });

        // Getting the IDs and Values of the tablerow
        for (var i = 0; i < dt.context[0].aoColumns.length; i++) {
          // .data is the attribute name, if any; .idx is the column index, so it should always exists
          var name = dt.context[0].aoColumns[i].data ? dt.context[0].aoColumns[i].data :
            dt.context[0].aoColumns[i].mData ? dt.context[0].aoColumns[i].mData : dt.context[0].aoColumns[i].idx;
          jsonDataArray[name] = adata.data()[0][name];
        }
        that.onDeleteRow(that,
          jsonDataArray,
          function (data) {
            that._deleteRowCallback(data);
          },
          function (data) {
            that._errorCallback(data);
          });
      },

      /**
       * Open Add Modal for selected row
       *
       * @private
       */
      _openAddModal: function () {
        var that = this;
        var dt = this.s.dt;
        var columnDefs = [];

        // Adding column attributes to object.
        for (var i in dt.context[0].aoColumns) {
          var obj = dt.context[0].aoColumns[i];
          columnDefs[i] = {
            title: obj.sTitle,
            name: (obj.data ? obj.data : obj.mData),
            type: (obj.type ? obj.type : 'text'),
            options: (obj.options ? obj.options : []),
            msg: (obj.errorMsg ? obj.errorMsg : ''),
            hoverMsg: (obj.hoverMsg ? obj.hoverMsg : ''),
            pattern: (obj.pattern ? obj.pattern : '.*'),
            special: (obj.special ? obj.special : ''),
            unique: (obj.unique ? obj.unique : false),
            uniqueMsg: (obj.uniqueMsg ? obj.uniqueMsg : ''),
            maxLength: (obj.maxLength ? obj.maxLength : false),
            multiple: (obj.multiple ? obj.multiple : false),
            select2: (obj.select2 ? obj.select2 : false)
          }
        }


        // Building add-form
        var data = "";
        data += "<form name='altEditor-form' role='form'>";
        for (var j in columnDefs) {
          if (columnDefs[j].type.indexOf("hidden") >= 0) {
            // just do nothing for hidden fields!
          }
          else {
            data += "<div style='margin-left: initial;margin-right: initial;' class='form-group row'><div class='col-sm-3 col-md-3 col-lg-3 text-right' style='padding-top:4px;'><label for='"
              + columnDefs[j].title
              + "'>"
              + columnDefs[j].title
              + ":</label></div><div class='col-sm-8 col-md-8 col-lg-8'>";

            // Adding text-inputs and errorlabels
            if (columnDefs[j].type.indexOf("text") >= 0) {
              data += "<input type='"
                + that._quoteattr(columnDefs[j].type)
                + "' id='"
                + that._quoteattr(columnDefs[j].name)
                + "'  pattern='"
                + that._quoteattr(columnDefs[j].pattern)
                + "'  title='"
                + that._quoteattr(columnDefs[j].hoverMsg)
                + "' name='"
                + that._quoteattr(columnDefs[j].title)
                + "' placeholder='"
                + that._quoteattr(columnDefs[j].title)
                + "' data-special='"
                + columnDefs[j].special
                + "' data-errorMsg='"
                + that._quoteattr(columnDefs[j].msg)
                + "' data-uniqueMsg='"
                + that._quoteattr(columnDefs[j].uniqueMsg)
                + "' data-unique='"
                + columnDefs[j].unique
                + "'"
                + (columnDefs[j].maxLength == false ? "" : " maxlength='" + columnDefs[j].maxLength + "'")
                + " style='overflow:hidden'  class='form-control  form-control-sm' value=''>";
              data += "<label id='" + that._quoteattr(columnDefs[j].name) + "label"
                + "' class='errorLabel'></label>";
            }

            // Adding readonly-fields
            if (columnDefs[j].type.indexOf("readonly") >= 0) {
              data += "<input type='text' readonly  id='"
                + that._quoteattr(columnDefs[j].name)
                + "' name='"
                + that._quoteattr(columnDefs[j].title)
                + "' placeholder='"
                + that._quoteattr(columnDefs[j].title)
                + "' style='overflow:hidden'  class='form-control  form-control-sm' value=''>";
            }

            // Adding select-fields
            if (columnDefs[j].type.indexOf("select") >= 0) {
              var options = "";
              for (var i = 0; i < columnDefs[j].options.length; i++) {
                options += "<option value='" + that._quoteattr(columnDefs[j].options[i])
                  + "'>" + columnDefs[j].options[i] + "</option>";
              }
              data += "<select class='form-control" + (columnDefs[j].select2 ? ' select2' : '') + "' id='" + that._quoteattr(columnDefs[j].name) + "' name='" + that._quoteattr(columnDefs[j].title) + "' " + (columnDefs[j].multiple ? 'multiple' : '') + ">" + options
                + "</select>";
            }
            data += "</div><div style='clear:both;'></div></div>";
          }
        }
        data += "</form>";

        $('#altEditor-modal').on('show.bs.modal', function () {
          var btns = '<button type="button" data-content="remove" class="btn btn-default" data-dismiss="modal">关闭</button>' +
            '<button type="button"  data-content="remove" class="btn btn-primary" id="addRowBtn' + that.s.namespace + '">添加</button>';
          $('#altEditor-modal').find('.modal-title').html('添加记录');
          $('#altEditor-modal').find('.modal-body').html(data);
          $('#altEditor-modal').find('.modal-footer').html(btns);
        });

        $('#altEditor-modal').modal('show');
        $('#altEditor-modal input[0]').focus();

        // enable select 2 items
        for (var j in columnDefs) {
          if (columnDefs[j].select2) {
            $("#altEditor-modal").find("select#" + columnDefs[j].name).select2(columnDefs[j].select2);
          }
        }
      },

      _addRowData: function () {
        var that = this;
        var dt = this.s.dt;

        var rowDataArray = {};

        // Getting the inputs from the modal
        $('form[name="altEditor-form"] *').filter(':input').each(function (i) {
          rowDataArray[$(this).attr('id')] = $(this).val();
        });
        console.info("_addRowData")
        that.onAddRow(that,
          rowDataArray,
          function (data) {
            that._addRowCallback(data);
          },
          function (data) {
            that._errorCallback(data);
          });

      },

      _deleteRowCallback: function (response, status, more) {
        $('#altEditor-modal .modal-body .alert').remove();

        var message = '<div class="alert alert-success" role="alert">' +
          '<strong>操作成功!</strong>' +
          '</div>';
        $('#altEditor-modal .modal-body').append(message);

        this.s.dt.row({
          selected: true
        }).remove();
        this.s.dt.draw();

        // Disabling submit button
        $("div#altEditor-modal").find('button#addRowBtn' + this.s.namespace).prop('disabled', true);
        $("div#altEditor-modal").find("button#editRowBtn" + this.s.namespace).prop('disabled', true);
        $("div#altEditor-modal").find("button#deleteRowBtn" + this.s.namespace).prop('disabled', true);
      },

      _addRowCallback: function (response, status, more) {
        var data = JSON.parse(response);
        $('#altEditor-modal .modal-body .alert').remove();

        var message = '<div class="alert alert-success" role="alert">' +
          '<strong>操作成功!</strong>' +
          '</div>';
        $('#altEditor-modal .modal-body').append(message);

        this.s.dt.row.add(data).draw(false);

        // Disabling submit button
        $("div#altEditor-modal").find('button#addRowBtn' + this.s.namespace).prop('disabled', true);
        $("div#altEditor-modal").find("button#editRowBtn" + this.s.namespace).prop('disabled', true);
        $("div#altEditor-modal").find("button#deleteRowBtn" + this.s.namespace).prop('disabled', true);
      },

      _editRowCallback: function (response, status, more) {
        //TODO should honor dt.ajax().dataSrc

        var data = JSON.parse(response);

        $('#altEditor-modal .modal-body .alert').remove();

        var message = '<div class="alert alert-success" role="alert">' +
          '<strong>操作成功!</strong>' +
          '</div>';
        $('#altEditor-modal .modal-body').append(message);
        this.s.dt.row({
          selected: true
        }).data(data);

        // Disabling submit button
        $("div#altEditor-modal").find('button#addRowBtn' + this.s.namespace).prop('disabled', true);
        $("div#altEditor-modal").find("button#editRowBtn" + this.s.namespace).prop('disabled', true);
        $("div#altEditor-modal").find("button#deleteRowBtn" + this.s.namespace).prop('disabled', true);
      },

      _errorCallback: function (response, status, more) {
        var error = response;
        var errstr = "There was an unknown error!";
        if (typeof(error.code) == "undefined") {
          $('#altEditor-modal .modal-body .alert').remove();
          if (error.responseJSON && error.responseJSON.errors) {
            errstr = "";
            for (var key in error.responseJSON.errors) {
              errstr += error.responseJSON.errors[key][0];
            }
          }
        } else {
          error.status = error.code;
          errstr = error.msg;
        }
        var message = '<div class="alert alert-danger" role="alert">' +
          '<strong>Error!</strong> ' + (error.status == null ? "" : 'Response code: ' + error.status) + " " + errstr +
          '</div>';

        $('#altEditor-modal .modal-body').append(message);
      },

      onAddRow: function (dt, rowdata, success, error) {
        console.log("Missing AJAX configuration for INSERT");
        success(rowdata);
      },

      onEditRow: function (dt, rowdata, success, error) {
        console.log("Missing AJAX configuration for UPDATE");
        success(rowdata);
      },

      onDeleteRow: function (dt, rowdata, success, error) {
        console.log("Missing AJAX configuration for DELETE");
        success(rowdata);
      },

      _inputValidation: function () {
        var that = this;
        var dt = this.s.dt;
        var isValid = false;
        var errorcount = 0;

        // Looping through all text fields
        $('form[name="altEditor-form"] *').filter(':text').each(
          function (i) {
            var errorLabel = "#" + $(this).attr("id") + "label";
            // reset error display
            $(errorLabel).hide();
            $(errorLabel).empty();
            if (!$(this).val().match($(this).attr("pattern"))) {
              $(errorLabel).html($(this).attr("data-errorMsg"));
              $(errorLabel).show();
              errorcount++;
            }
            // now check if its should be unique
            else if ($(this).attr("data-unique") == "true") {
              // go through each item in this column
              var colData = dt.column("th:contains('" + $(this).attr("name") + "')").data();
              var selectedCellData = null;
              if (dt.row({selected: true}).index() != null)
                selectedCellData = dt.cell(dt.row({selected: true}).index(), dt.column("th:contains('" + $(this).attr("name") + "')").index()).data();
              for (var j in colData) {
                // if the element is in the column and its not the selected one then its not unique
                if ($(this).val() == colData[j] && colData[j] != selectedCellData) {
                  $(errorLabel).html($(this).attr("data-uniqueMsg"));
                  $(errorLabel).show();
                  errorcount++;
                }
              }
            }
          });

        if (errorcount == 0) {
          isValid = true;
        }

        return isValid;
      },

      _quoteattr: function (s, preserveCR) {
        preserveCR = preserveCR ? '&#13;' : '\n';
        return ('' + s) /* Forces the conversion to string. */
          .replace(/&/g, '&amp;') /* This MUST be the 1st replacement. */
          .replace(/'/g, '&apos;') /* The 4 other predefined entities, required. */
          .replace(/"/g, '&quot;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/\r\n/g, preserveCR) /* Must be before the next replacement. */
          .replace(/[\r\n]/g, preserveCR);
      },
    });

  altEditor.version = '2.0';

  altEditor.defaults = {
    /**
     * @type {Boolean} Ask user what they want to do, even for a single
     *       option
     */
    alwaysAsk: false,

    /** @type {string|null} What will trigger a focus */
    focus: null, // focus, click, hover

    /** @type {column-selector} Columns to provide auto fill for */
    columns: '', // all

    /** @type {boolean|null} Update the cells after a drag */
    update: null, // false is editor given, true otherwise

    /** @type {DataTable.Editor} Editor instance for automatic submission */
    editor: null
  };

  altEditor.classes = {
    /** @type {String} Class used by the selection button */
    btn: 'btn'
  };

  $(document).on('preInit.dt.altEditor', function (e, settings, json) {
    if (e.namespace !== 'dt') {
      return;
    }

    var init = settings.oInit.altEditor;
    var defaults = DataTable.defaults.altEditor;

    if (init || defaults) {
      var opts = $.extend({}, init, defaults);

      if (init !== false) {
        new altEditor(settings, opts);
      }
    }
  });

  // Alias for access
  DataTable.altEditor = altEditor;
  return altEditor;

});

