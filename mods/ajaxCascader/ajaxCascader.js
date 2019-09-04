"use strict";

/**
 * @Name: 基于layui的异步无限级联选择器
 * @Author: 前端喵
 * 创建时间: 2019/05/23
 * 使用说明: 在主文件里面使用layui.config设置，具体方法看index.html
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
      clicklast: false,
      time: 250,
      placeholder: "请选择",
      search: {
        show: false,
        minLabel: 10,
        placeholder: '请输入搜索词'
      },
      clear: false
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
      zIndex: 2000 // 显示顺序
    };
  }
  // 页面初始化
  Private.prototype.init = function (options) {
    var _this2 = this;

    var store = this.store;
    var param = this.param;
    // dom变量初始化
    store.cascaderDom = $(options.elem);

    // 把用户的参数值进行存储
    // 开始存储
    for (var _i in options) {
      if (options[_i].length !== 0) {
        if (_i == "prop" | _i == 'search') {
          for (var x in options[_i]) {
            param[_i][x] = options[_i][x];
          }
        } else {
          param[_i] = options[_i];
        }
      }
    }
    delete param.data;
    if (options.data) {
      store.data = options.data;
    }
    param.device = this.checkDevice();
    // 存储结束
    if (store.cascaderDom.next().hasClass('cascader-all')) {
      store.cascaderDom.next().remove();
    }
    param.className = 'cascader-' + this.param.elem.replace('#', '');
    var phoneName = '';
    if (param.device === 1) {
      phoneName = 'cascader-model-phone';
    }
    var clearButtonDom = '';
    var clearInput = '';
    if (param.clear) {
      clearInput = 'cascader-input-clear';
      clearButtonDom = "<i class=\"layui-icon layui-icon-close cascader-clear\" style=\"top:" + this.param.height / 2 + "px;\"></i>";
    }
    // 渲染主dom
    store.cascaderDom.after("\n\t\t\t<div class=\"cascader-all " + param.className + " " + clearInput + "\" style=\"width:" + this.param.width + "px;\">\n\t\t\t\t<input type=\"text\" class=\"layui-input cascader-input\" placeholder=\"" + param.placeholder + "\" readonly style=\"width:" + this.param.width + "px;height:" + this.param.height + "px;\">\n\t\t\t\t<i class=\"layui-icon layui-icon-down cascader-i\" style=\"top:" + this.param.height / 2 + "px;\"></i>\n\t\t\t\t" + clearButtonDom + "\n\t\t\t\t<div class=\"cascader-model " + phoneName + "\" style=\"z-index:" + this.store.zIndex + ";display:flex;\">\n\t\t\t\t</div>\n\t\t\t</div>\n \t\t");

    // 判断elem是否存在以及是否正确，elem必填
    if (!options.elem || options.elem == "") {
      layer.msg('请配置有效的elem值 ');
    } else if ($(options.elem).length == 0) {
      layer.msg('请配置有效的elem值 ');
    }

    store.input = store.cascaderDom.nextAll().find('.cascader-input');
    store.inputI = store.input.next();
    store.cascaderAll = $(store.cascaderDom.nextAll()[0]);
    store.model = store.cascaderDom.nextAll().find('.cascader-model');
    store.li = store.model.find('li');
    if (param.clear) {
      store.clearButton = store.cascaderAll.find('.cascader-clear');
      this.clearButtonClick();
    }
    // 全局状态初始化
    store.model.hide();

    if (store.data.length == 0) {
      param.getChildren(param.value, function (data) {
        store.data = data;
        _this2.liHtml(store.data);
        if (param.chooseData) {
          if (param.chooseData.length > 0) {
            _this2.dataToshow(param.chooseData);
          }
        }
      });
    } else {
      this.liHtml(store.data);
      if (param.chooseData) {
        if (param.chooseData.length > 0) {
          this.dataToshow(param.chooseData);
        }
      }
    }
    // 先进入是否禁用判断事件
    // 不禁用则执行下面的事件
    this.disabled().then(function (res) {
      _this2.inputClick(options);
      _this2.inputHover();
      _this2.liClick();
      _this2.liHover();
      _this2.modelHandle();
      if (param.search.show) {
        _this2.handleSearch();
      }
    });
  };

  // 判断是否禁用
  Private.prototype.disabled = function () {
    var disabled = this.param.disabled;
    var cascaderAll = this.store.cascaderAll;
    var input = this.store.input;
    return new Promise(function (resolve, reject) {
      if (disabled) {
        cascaderAll.addClass('cascader-disabled');
      } else {
        resolve();
      }
    });
  };

  // li标签赋值方法
  // key为string类型
  Private.prototype.liHtml = function (data, key, choose) {
    var lis = [];
    var param = this.param;
    var store = this.store;
    var position = [];
    var key1 = '';
    if (!key || key.length == 0) {
      key = "";
    } else {
      key = key.join('-');
      key1 = key;
      key = key + "-";
    }
    if (data !== "") {
      for (var _i2 in data) {
        var li = '<li value="' + data[_i2][param.prop.value] + '" key="' + key + _i2 + '"';
        if (_i2 == choose) {
          li = li + ' class="cascader-choose-active"';
          position = [_i2, data.length];
        }
        // 来自于陈诗樵的BUG修复,github地址:https://github.com/alasq
        // data[i].children 改为 data[i][param.prop.children]
        if (data[_i2].hasChild == true || data[_i2][param.prop.children]) {
          li = li + '>' + data[_i2][param.prop.label] + '<i class="layui-icon layui-icon-right"></i></li>';
        } else {
          li = li + '>' + data[_i2][param.prop.label] + '</li>';
        }
        lis.push(li);
      }
    }
    lis = lis.join('');
    if (data && data.length > 0) {
      if (param.search.show && data.length > param.search.minLabel) {
        lis = '<input class="layui-input cascader-model-input" key="' + key1 + '" placeholder="' + param.search.placeholder + '">' + lis;
      }
    } else {
      lis = '<p class="nodata">暂无数据</p>';
    }
    var ul = $("\n\t\t\t<ul class=\"cascader-ul\">" + lis + "</ul>\n\t\t");
    ul.fadeIn('fast');
    store.model.append(ul);
    this.liPosition(position);
    this.ModelPosition();
  };

  // 当前选中的跳转位置
  // position:['0', 10]，
  // '0': 代表当前选中的位置，已使用
  // '10': 代表当前data的长度,暂时未用到
  Private.prototype.liPosition = function (position) {
    var currentIndex = Number(position[0]);
    var model = this.store.model.find('ul').last();
    // ul标签的高度
    var ulHeight = model.height();
    // li标签的高度= 自身高度 + margin + padding 高度
    var liHeight = model.find('li').outerHeight();
    var minScroll = ulHeight / liHeight;
    if (currentIndex > minScroll) {
      // model.scrollTop = 0
      // console.log(model.scrollTop())
      // = currentIndex * liHeight
      $(model).animate({
        scrollTop: currentIndex * liHeight
      }, 500);
    }
  };
  // 监听清空按钮点击事件
  Private.prototype.clearButtonClick = function () {
    var _this3 = this;

    var store = this.store;
    var clearButton = this.store.clearButton;
    console.log(clearButton);
    clearButton.click(function () {
      _this3.store.chooseData = [];
      _this3.inputValueChange([]);
    });
  };
  // 监听搜索事件
  Private.prototype.handleSearch = function () {
    var model = this.store.model;
    var prop = this.param.prop;
    var _this = this;
    var value = '';
    var flag = true;
    model.on('compositionstart', function () {
      flag = false;
    });
    model.on('compositionend', function () {
      flag = true;
    });
    model.on('input', 'input', function () {
      var _this4 = this;

      setTimeout(function () {
        if (flag) {
          var data = _this.store.data;
          if (value == _this4.value) {
            return;
          }
          value = _this4.value;
          var key = $(_this4).attr('key').split('-');
          var key1 = $(_this4).attr('key') + '-';
          if ($(_this4).attr('key')) {
            for (i in key) {
              if (data[key[i]][prop.children]) {
                data = data[key[i]][prop.children];
              }
            }
          }
          var renderData = [];
          var lis = '';
          if (key1 == '-') {
            key1 = '';
          }
          for (i in data) {
            if (data[i][prop.label].indexOf(value) > -1) {
              if (data[i][prop.children] | data[i].hasChild) {
                lis += '<li value="' + data[i][prop.value] + '" key="' + key1 + i + '">' + data[i][prop.label] + '<i class="layui-icon layui-icon-right"></i></li>';
              } else {
                lis += '<li value="' + data[i][prop.value] + '" key="' + key1 + i + '">' + data[i][prop.label] + '</li>';
              }

              renderData.push(data[i]);
            }
          }
          $(_this4.parentNode).find('li').remove();
          $(_this4.parentNode).append(lis);
        }
      }, 0);
    });
  };
  // 监听窗口变化事件
  Private.prototype.modelHandle = function () {
    var _this5 = this;

    $(window).resize(function () {
      //当浏览器大小变化时
      var model = _this5.store.model;
      _this5.ModelPosition();
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
      var _this6 = this;

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

          var keys = $(_this6).attr('key');
          var value = $(_this6).attr('value');
          var data = _this.store.data;
          var childrenName = _this.param.prop.children;
          keys = keys.split('-');
          var goodData = data;

          for (var _i3 in keys) {
            var key = keys[_i3];
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
                for (var _i4 in keys) {
                  if (_i4 == keys.length - 1) {
                    children = goodData;
                  } else {
                    if (!children[keys[_i4]][childrenName]) {
                      children[keys[_i4]][childrenName] = new Array();
                    }
                    children = children[keys[_i4]][childrenName];
                  }
                }
                DataTreeAdd(data, goodData, keys);
                store.parentNextAll = $(_this6).parent("ul").nextAll();
                store.parentNextAll.remove();
                _this.liHtml(goodData, keys);
              } else {
                $(_this6).find('i').remove();
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
    var param = this.param;
    var className = param.className;
    // store.model为一个自定义dom对象
    if (param.clicklast == false) {
      store.model.on('click', 'li', function () {
        _this.getChooseData();
        store.showCascader = !store.showCascader;
        if (param.device === 1) {} else {
          store.model.slideUp(_this.param.time);
        }
        store.inputI.removeClass('rotate');
      });
    } else {
      store.model.on('click', 'li', function () {
        store.parentNextAll = $(this).parent("ul").nextAll();
        if (store.parentNextAll.length == 0) {
          _this.getChooseData();
          store.showCascader = !store.showCascader;
          if (param.device === 1) {} else {
            store.model.slideUp(_this.param.time);
          }
          store.inputI.removeClass('rotate');
          _this.getThisData();
        }
      });
    }
  };

  // 判断当前访问客户端是PC还是移动端
  // PC端返回1，移动端返回0
  Private.prototype.checkDevice = function () {
    if (/Android|webOS|iPhone|iPod|BlackBerry/i.test(navigator.userAgent)) {
      return 1;
    } else {
      return 0;
    }
  };

  // 获取当前层级数据
  Private.prototype.getThisData = function () {
    var value = this.param.prop.value,
        children = this.param.prop.children,
        chooseData = this.store.chooseData,
        data = this.store.data,
        currentData = [];
    for (var _i5 in chooseData) {
      for (var x in data) {
        if (chooseData[_i5] == data[x][value]) {
          if (Number(_i5) === chooseData.length - 1) {
            currentData = JSON.parse(JSON.stringify(data[x]));
            break;
          }
          if (data[x][children]) {
            data = data[x][children];
          } else {
            data = data[x];
          }
          break;
        }
      }
    }
    return currentData;
  };
  // 鼠标监听事件【input控件hover】
  Private.prototype.inputHover = function () {
    var param = this.param;
    var store = this.store;

    // 如果用户配置了清空
    if (param.clear) {
      // 监听input框hover事件
      store.input.hover(function () {
        if (store.chooseData.length === 0) {
          store.cascaderAll.removeClass('cascader-input-clear');
        } else {
          store.cascaderAll.addClass('cascader-input-clear');
        }
      });
    }
  };
  // 鼠标监听事件[input控件click]
  Private.prototype.inputClick = function (options) {
    var store = this.store;
    var param = this.param;
    var _this = this;
    $(document).click(function (e) {
      var className = e.target.className;
      className = className.split(" ");
      var other = ['cascader-input', 'cascader-model', "cascader-choose-active", "layui-icon-right", "cascader-ul", "cascader-model-input"];
      for (var _i6 in className) {
        for (var x in other) {
          if (className[_i6] == other[x]) {
            return;
          }
        }
      }
      store.showCascader = false;
      store.model.slideUp(_this.param.time);
      store.inputI.removeClass('rotate');
    });
    // 监听 input 点击事件
    store.input.click(function () {
      store.showCascader = !store.showCascader;
      if (store.showCascader == true) {
        store.inputI.addClass('rotate');
        var chooseData = _this.store.chooseData;
        var data = _this.store.data;
        if (chooseData.length !== 0) {
          var key = [];
          _this.clearModel();
          for (var _i7 in chooseData) {
            for (var x in data) {
              if (data[x][param.prop.value] == chooseData[_i7]) {
                _this.liHtml(data, key, x);
                key.unshift(x);
                data = data[x][param.prop.children];
                break;
              }
            }
          }
        } else {
          _this.clearModel();
          _this.liHtml(data);
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
    for (var _i8 in chooseDom) {
      if (chooseDom[_i8].innerText) {
        chooseData.push($(chooseDom[_i8]).attr('value'));
        chooseLabel.push(chooseDom[_i8].innerText);
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
  Private.prototype.dataToshow = function (choosedata) {
    var _this7 = this;

    var param = this.param;
    var store = this.store;
    var backData = []; //后端数据集合
    var chooseLabel = []; //选中的项对应的label值
    var keys = []; //choosedata在数据源中的位置大全
    backData[0] = store.data;
    var flag = 1;
    if (param.getChildren) {
      if (choosedata.length === 1) {
        for (var _i9 in store.data) {
          if (store.data[_i9][param.prop.value] == choosedata[0]) {
            var label = store.data[_i9][param.prop.label].split(',');
            this.inputValueChange(label);
            return;
          }
        }
      }

      var _loop = function _loop(_i10) {
        if (_i10 < choosedata.length) {
          param.getChildren(choosedata[_i10 - 1], function (data) {
            backData[_i10] = data;
            flag++;
            if (flag == choosedata.length) {
              for (var _i11 = choosedata.length - 1; _i11 >= 0; _i11--) {
                for (var x in backData[_i11]) {
                  if (choosedata[_i11] == backData[_i11][x][param.prop.value]) {
                    keys.unshift(x);
                    chooseLabel.unshift(backData[_i11][x][param.prop.label]);
                    if (_i11 < choosedata.length - 1) {
                      backData[_i11][x][param.prop.children] = backData[_i11 + 1];
                    }
                  }
                }
              }
              store.data = backData[0];

              // input框数据回显
              _this7.inputValueChange(chooseLabel);
              _this7.clearModel();
              // 选择器数据回显
              var key = [];
              for (var _i12 in backData) {
                if (_i12 !== "0") {
                  key.push(keys[_i12 - 1]);
                }
                _this7.liHtml(backData[_i12], key, keys[_i12]);
              }
            }
          });
        }
      };

      for (var _i10 = 1; _i10 < choosedata.length; _i10++) {
        _loop(_i10);
      }
    } else {
      var storeData = store.data;
      for (var x in choosedata) {
        for (var _i13 in storeData) {
          if (storeData[_i13][param.prop.value] == choosedata[x]) {
            chooseLabel.push(storeData[_i13][param.prop.label]);
            keys.push(_i13);
            storeData = storeData[_i13][param.prop.children];
            break;
          }
        }
      }
      // input框数据回显
      this.inputValueChange(chooseLabel);
      this.store.chooseData = choosedata;
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
      var current = null;
      for (var _i14 in privates) {
        if (privates[_i14].elem === options.elem) {
          current = _i14;
        }
      }
      if (!current) {
        current = dom_num;
        dom_num++;
        privates[current] = new Array();
        privates[current].obj = new Private();
      }
      privates[current].elem = options.elem;
      privates[current].obj.store.zIndex -= current;
      privates[current].obj.store.data = [];
      if (options.chooseData) {
        privates[current].obj.store.chooseData = options.chooseData;
      } else {
        privates[current].obj.store.chooseData = [];
      }
      privates[current].obj.init(options);
    },

    // 获取页面中选中的数据，数组形式
    getChooseData: function getChooseData(elem) {
      var obj = this.elemCheck(elem);
      return obj.store.chooseData;
    },

    // 监听方法
    on: function on(type, elem, callback) {
      var obj = this.elemCheck(elem);
      var className = obj.param.className;
      if (type == "click") {
        $(document).on('click', '.' + className + ' li', function () {
          setTimeout(function () {
            var data = obj.getThisData();
            if (obj.param.clicklast === false) {
              callback(data);
            } else {
              if (obj.store.parentNextAll.length == 0) {
                callback(data);
              }
            }
          }, 50);
        });
      } else if (type == "hover") {
        obj.store.model.on('mouseenter', 'li', function () {
          callback();
        });
      }
    },

    // elem位置判断，禁止外界调用，因为你调也没啥卵用
    elemCheck: function elemCheck(elem) {
      if (!elem) {
        return privates[0].obj;
      }
      for (var _i15 in privates) {
        if (privates[_i15].elem == elem) {
          return privates[_i15].obj;
        }
      }
    }
  };
  layui.link(layui.cache.base + 'ajaxCascader.css');
  exports('ajaxCascader', cascader);
});