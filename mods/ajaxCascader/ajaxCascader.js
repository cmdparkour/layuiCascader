"use strict";

/**
 * @Name: 基于layui的异步无限级联选择器
 * @Author: 前端喵
 * 创建时间: 2019/05/23
 * 修改时间：2019/05/27 ----- 2019/05/28
 * 使用说明: 在主文件里面使用layui.config设置，具体方法看index.html
 */

/**
* 参数说明：
*       width（可选） :input框宽度
*     height（可选）：input框高度
*/
layui.define(["jquery"], function (exports) {
  var $ = layui.jquery;

  // 私有方法，禁止外面调用的方法
  function Private() {
    //页面初始化默认值
    this.param = {
      width: 220,
      height: 40,
      prop: {
        value: "value",
        label: "label",
        children: 'children'
      },
      time: 250,
      placeholder: "请选择"
    },
    // 定义全局状态仓库
    this.store = {
      showCascader: false,
      cascaderDom: null, // 当前elem对象
      cascaderAll: null, // 生成的Dom主对象
      input: null, // input框dom
      inputI: null, // input框箭头dom
      model: null, // 下拉菜单的主dom
      li: null, // li标签
      parentNextAll: null, // 当前操作的li标签元素后面所有ul集合
      brother: null, // li标签同级dom集合
      data: [], // 所有从后端异步请求的数据集合
      chooseData: [], // 已选中的数据集
      zIndex: 2000 };
  }

  // 页面初始化
  Private.prototype.init = function (options) {
    var _this2 = this;

    var store = this.store;
    var param = this.param;
    // dom变量初始化
    store.cascaderDom = $(options.elem);

    // 把用户的参数值进行存储
    for (var i in options) {
      if (options[i].length !== 0) {
        if (i == "prop") {
          for (var x in options[i]) {
            param[i][x] = options[i][x];
          }
        } else {
          param[i] = options[i];
        }
      }
    }

    delete param.data;
    if (options.data) {
      store.data = options.data;
    }
    // 存储结束

    if (store.cascaderDom.next().hasClass('cascader-all')) {
      store.cascaderDom.next().remove();
    }
    // 渲染主dom
    store.cascaderDom.after("\n\t\t\t<div class=\"cascader-all\" style=\"width:" + this.param.width + "px;\">\n\t\t\t\t<input type=\"text\" class=\"layui-input cascader-input\" placeholder=\"" + param.placeholder + "\" readonly style=\"width:" + this.param.width + "px;height:" + this.param.height + "px;\">\n\t\t\t\t<i class=\"layui-icon layui-icon-down cascader-i\" style=\"top:" + this.param.height / 2 + "px;\"></i>\n\t\t\t\t<div class=\"cascader-model\" style=\"z-index:" + this.store.zIndex + ";display:flex;\">\n\t\t\t\t</div>\n\t\t\t</div>\n \t\t");

    // 判断elem是否存在以及是否正确，elem必填
    if (!options.elem || options.elem == "") {
      layer.msg('请配置有效的elem值 ');
    } else if ($(options.elem).length == 0) {
      layer.msg('请配置有效的elem值 ');
    }

    store.input = store.cascaderDom.nextAll().find('.cascader-input');
    store.inputI = store.input.next();
    store.model = store.cascaderDom.nextAll().find('.cascader-model');
    store.li = store.model.find('li');
    // 全局状态初始化
    store.model.hide();
    if (store.data.length == 0) {
      param.getChildren(param.value, function (data) {
        store.data = data;
        _this2.liHtml(store.data);
        if (param.checkData) {
          if (param.checkData.length > 0) {
            _this2.dataToshow(param.checkData);
          }
        }
      });
    } else {
      this.liHtml(store.data);
      if (param.checkData) {
        if (param.checkData.length > 0) {
          this.dataToshow(param.checkData);
        }
      }
    }
    this.inputClick(options);
    this.liClick();
    this.liHover();
    this.modelHandle();
  };

  // li标签赋值方法
  // key为string类型
  Private.prototype.liHtml = function (data, key, choose) {
    var lis = [];
    var param = this.param;
    var store = this.store;
    var position = [];
    if (!key || key.length == 0) {
      key = "";
    } else {
      key = key.join('-');
      key = key + "-";
    }
    if (data !== "") {
      for (var i in data) {
        var li = '<li value="' + data[i][param.prop.value] + '" key="' + key + i + '"';
        if (i == choose || data[i][param.prop.value] == choose) {
          li = li + ' class="cascader-choose-active"';
          position = [i, data.length];
        }
        if (data[i].hasChild == true || data[i].children) {
          li = li + '>' + data[i][param.prop.label] + '<i class="layui-icon layui-icon-right"></i></li>';
        } else {
          li = li + '>' + data[i][param.prop.label] + '</li>';
        }
        lis.push(li);
      }
    }
    lis = lis.join('');
    var ul = $("\n\t\t\t<ul class=\"cascader-ul\">" + lis + "</ul>\n\t\t");
    ul.fadeIn('fast');
    store.model.append(ul);
    this.liPosition(position);
    this.ModelPosition();
  };
  // 当前选中的跳转位置
  Private.prototype.liPosition = function (position) {
    var model = this.store.model.find('ul').last();
  };
  Private.prototype.modelHandle = function () {
    var _this3 = this;

    $(window).resize(function () {
      //当浏览器大小变化时
      var model = _this3.store.model;
      _this3.ModelPosition();
    });
  };
  var modelWidth = 0;
  Private.prototype.ModelPosition = function () {
    var model = this.store.model;
    var input = this.store.input;
    var BodyWidth = document.documentElement.clientWidth;
    var positionLeft = 0,
        left = 0;
    if (window.getComputedStyle(model[0]).width !== "auto") {
      modelWidth = window.getComputedStyle(model[0]).width.replace('px', '');
    }
    left = input.offset().left - model.position().left;
    if (BodyWidth < modelWidth) {
      positionLeft = BodyWidth - modelWidth;
    } else {
      // right = BodyWidth - modelWidth;
    }
    if (positionLeft < 0) {
      model.css("left", positionLeft - 30);
    } else {
      model.css('left', 0);
    }
  };
  // 鼠标hover监听事件[li标签]
  Private.prototype.liHover = function () {
    var store = this.store;
    var param = this.param;
    var _this = this;
    store.model.on('mouseenter', 'li', function () {
      var _this4 = this;

      store.parentNextAll = $(this).parent("ul").nextAll();
      store.brother = $(this).siblings();
      if ($(this).find('i').length == 0) {
        store.parentNextAll.fadeOut('fast', function () {
          store.parentNextAll.remove();
        });
      } else {
        (function () {
          // 增加data的树结点
          var DataTreeAdd = function DataTreeAdd(data, newData, keys) {
            var array = data;
            for (var k in keys) {
              if (k < keys.length - 1) {
                array = array[keys[k]][param.prop.children];
              } else {
                array = array[keys[k]];
              }
            }
            array.children = newData;
          };

          var DataTreeChange = function DataTreeChange(data, keys) {
            var array = data;
            for (var k in keys) {
              if (k < keys.length - 1) {
                array = array[keys[k]][param.prop.children];
              } else {
                array = array[keys[k]];
              }
            }
            array.hasChild = false;
          };

          var keys = $(_this4).attr('key');
          var value = $(_this4).attr('value');
          var data = _this.store.data;
          var childrenName = _this.param.prop.children;
          keys = keys.split('-');
          var goodData = data;

          for (var i in keys) {
            var key = keys[i];
            if (goodData) {
              if (goodData[key]) {
                goodData = goodData[key][childrenName];
              }
            }
          }

          if (!goodData) {
            param.getChildren(value, function (datax) {
              goodData = datax;
              var children = data;
              if (goodData && goodData.length != 0) {
                for (var _i in keys) {
                  if (_i == keys.length - 1) {
                    children = goodData;
                  } else {
                    if (!children[keys[_i]][childrenName]) {
                      children[keys[_i]][childrenName] = new Array();
                    }
                    children = children[keys[_i]][childrenName];
                  }
                }
                DataTreeAdd(data, goodData, keys);
                store.parentNextAll = $(_this4).parent("ul").nextAll();
                store.parentNextAll.remove();
                _this.liHtml(goodData, keys);
              } else {
                $(_this4).find('i').remove();
                store.parentNextAll.remove();
                DataTreeChange(data, keys);
              }
            });
          } else {
            store.parentNextAll.remove();
            _this.liHtml(goodData, keys);
          }
        })();
      }
      $(this).addClass('cascader-choose-active');
      store.brother.removeClass('cascader-choose-active');
      store.parentNextAll.children().removeClass('cascader-choose-active');

      // 获取所有的已选中的数据，并回显至input选择框中
      // _this.getChooseData();
    });
  };
  // 鼠标点击监听事件[li标签]
  Private.prototype.liClick = function () {
    var _this = this;
    var store = this.store;
    // store.model为一个自定义dom对象
    // mouseenter能正常执行程序
    // click则不行
    // store.model.on('mouseenter','li',function(){
    store.model.on('click', 'li', function () {
      _this.getChooseData();
      store.showCascader = !store.showCascader;
      store.model.slideUp(_this.param.time);
      store.inputI.removeClass('rotate');
    });
  };

  // 鼠标监听事件[input控件]
  Private.prototype.inputClick = function (options) {
    var store = this.store;
    var param = this.param;
    var _this = this;
    $(document).click(function (e) {
      var className = e.target.className;
      className = className.split(" ");
      var other = ['cascader-input', 'cascader-model', "cascader-choose-active", "layui-icon-right", "cascader-ul"];
      for (var i in className) {
        for (var x in other) {
          if (className[i] == other[x]) {
            return;
          }
        }
      }
      store.showCascader = false;
      store.model.slideUp(_this.param.time);
      store.inputI.removeClass('rotate');
    });
    store.input.click(function () {
      store.showCascader = !store.showCascader;
      if (store.showCascader == true) {
        store.inputI.addClass('rotate');
        var chooseData = _this.store.chooseData;
        if (chooseData.length != 0) {
          var data = _this.store.data;
          var key = [];
          _this.clearModel();
          for (var i in chooseData) {
            for (var x in data) {
              if (data[x][param.prop.value] == chooseData[i]) {
                _this.liHtml(data, key, x);
                key.unshift(x);
                data = data[x][param.prop.children];
                break;
              }
            }
          }
        }
        store.model.slideDown(_this.param.time);
        _this.ModelPosition();
      } else {
        store.model.slideUp(_this.param.time);
        store.inputI.removeClass('rotate');
      }
    });
  };

  // 获取页面中选中的数据
  Private.prototype.getChooseData = function () {
    var store = this.store;
    var chooseDom = store.model.find('li.cascader-choose-active');
    var chooseData = [];
    var chooseLabel = [];
    for (var i in chooseDom) {
      if (chooseDom[i].innerText) {
        chooseData.push($(chooseDom[i]).attr('value'));
        chooseLabel.push(chooseDom[i].innerText);
      } else {
        break;
      }
    }
    this.store.chooseData = chooseData;
    this.inputValueChange(chooseLabel);
  };
  Private.prototype.inputValueChange = function (label) {
    var store = this.store;
    var param = this.param;
    if (param.showlast == true) {
      label = label[label.length - 1];
    } else {
      label = label.join('/');
    }
    store.input.val(label);
    var fontWidth = store.input.css('font-size').replace('px', ''),
        inputWidth = store.input.width(),
        labelWidth = label.length;
    var maxLabelWidth = Math.floor(inputWidth / fontWidth);
    if (labelWidth > maxLabelWidth) {
      store.input.attr('title', label);
    } else {
      store.input.attr('title', "");
    }
  };
  // 数据回显
  Private.prototype.dataToshow = function (checkData) {
    var _this5 = this;

    var param = this.param;
    var store = this.store;
    var backData = []; //后端数据集合
    var chooseLabel = []; //选中的项对应的label值
    var keys = []; //checkData在数据源中的位置大全
    backData[0] = store.data;
    var flag = 1;
    if (param.getChildren) {
      var _loop = function _loop(i) {
        if (i < checkData.length) {
          param.getChildren(checkData[i - 1], function (data) {
            backData[i] = data;
            flag++;
            if (flag == checkData.length) {
              for (var _i2 = checkData.length - 1; _i2 >= 0; _i2--) {
                for (var x in backData[_i2]) {
                  if (checkData[_i2] == backData[_i2][x][param.prop.value]) {
                    keys.unshift(x);
                    chooseLabel.unshift(backData[_i2][x][param.prop.label]);
                    if (_i2 < checkData.length - 1) {
                      backData[_i2][x][param.prop.children] = backData[_i2 + 1];
                    }
                  }
                }
              }
              store.data = backData[0];

              // input框数据回显
              _this5.inputValueChange(chooseLabel);
              _this5.clearModel();
              // 选择器数据回显
              var key = [];
              for (var _i3 in backData) {
                if (_i3 !== "0") {
                  key.push(keys[_i3 - 1]);
                }
                _this5.liHtml(backData[_i3], key, keys[_i3]);
              }
            }
          });
        }
      };

      for (var i = 1; i < checkData.length; i++) {
        _loop(i);
      }
    } else {
      var storeData = store.data;
      for (var x in checkData) {
        for (var _i4 in storeData) {
          if (storeData[_i4][param.prop.value] == checkData[x]) {
            chooseLabel.push(storeData[_i4][param.prop.label]);
            keys.push(_i4);
            storeData = storeData[_i4][param.prop.children];
            break;
          }
        }
      }
      // input框数据回显
      this.inputValueChange(chooseLabel);
      this.store.chooseData = checkData;
    }
  };
  // 清空ul标签
  Private.prototype.clearModel = function () {
    var store = this.store;
    store.model.html('');
  };
  // 监听下拉菜单的位置
  Private.prototype.handlePosition = function () {
    // 当前屏幕大小
    // let bodyWidth = 
  };

  var privates = new Array();
  var dom_num = 0;
  // 暴露给外界使用的方法
  var cascader = {

    // 页面初始化
    load: function load(options) {
      privates[dom_num] = new Array();
      privates[dom_num].elem = options.elem;
      privates[dom_num].obj = new Private();
      privates[dom_num].obj.store.zIndex -= dom_num;
      privates[dom_num].obj.init(options);
      dom_num++;
    },
    // elem位置判断
    elemCheck: function elemCheck(elem) {
      if (!elem) {
        return privates[0].obj;
      }
      for (var i in privates) {
        if (privates[i].elem == elem) {
          return privates[i].obj;
        }
      }
    },
    // 获取页面中选中的数据，数组形式
    getChooseData: function getChooseData(elem) {
      var obj = this.elemCheck(elem);
      return obj.store.chooseData;
    },
    // 监听方法
    on: function on(type, elem, callback) {
      var obj = this.elemCheck(elem);
      if (type == "click") {
        obj.store.model.on('click', 'li', function () {
          callback();
        });
      } else if (type == "hover") {
        obj.store.model.on('mouseenter', 'li', function () {
          callback();
        });
      }
    }
  };
  layui.link(layui.cache.base + 'ajaxCascader.css');
  exports('ajaxCascader', cascader);
});