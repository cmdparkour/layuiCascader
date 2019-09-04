/**
 * @Name: 基于layui的异步无限级联选择器
 * @Author: 前端喵
 * 创建时间: 2019/05/23
 * 使用说明: 在主文件里面使用layui.config设置，具体方法看index.html
 */

 layui.define(["jquery"],(exports)=>{
 	let $ = layui.jquery;
 	// 私有方法，禁止外面调用的方法
 	function Private(){
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
	 		cascaderDom: null,					// 当前elem对象
	 		cascaderAll: null,					// 生成的Dom主对象
	 		input: null,						// input框dom
	 		inputI: null,						// input框箭头dom
	 		model: null,						// 下拉菜单的主dom
	 		li: null,							// li标签
	 		parentNextAll: null,				// 当前操作的li标签元素后面所有ul集合
	 		brother: null,						// li标签同级dom集合
	 		data: [],							// 所有从后端异步请求的数据集合
	 		chooseData: [],						// 已选中的数据集
	 		zIndex: 2000						// 显示顺序
	 	}
 	}
 	// 页面初始化
 	Private.prototype.init = function(options){
 		let store = this.store
 		let param = this.param
 		// dom变量初始化
 		store.cascaderDom = $(options.elem)	

 		// 把用户的参数值进行存储
 		// 开始存储
 		for (let i in options) {
 			if (options[i].length !== 0) {
 				if (i == "prop" | i == 'search') {
 					for (let x in options[i]) {
 						param[i][x] = options[i][x]
 					}
 				} else {
 					param[i] = options[i]
 				}
 			}
 		}
 		delete param.data
 		if (options.data) {
 			store.data = options.data
 		}
 		param.device = this.checkDevice()
 		// 存储结束
 		if (store.cascaderDom.next().hasClass('cascader-all')) {
 			store.cascaderDom.next().remove()
 		}
 		param.className = 'cascader-' + this.param.elem.replace('#', '')
 		let phoneName = ''
 		if (param.device === 1) {
 			phoneName = 'cascader-model-phone'
 		}
 		let clearButtonDom = ''
 		let clearInput = ''
 		if (param.clear) {
 			clearInput = 'cascader-input-clear'
 			clearButtonDom = `<i class="layui-icon layui-icon-close cascader-clear" style="top:`+this.param.height/2+`px;"></i>`
 		}
 		// 渲染主dom
 		store.cascaderDom.after(`
			<div class="cascader-all ` + param.className + ` `+ clearInput +`" style="width:`+this.param.width+`px;">
				<input type="text" class="layui-input cascader-input" placeholder="`+param.placeholder+`" readonly style="width:`+this.param.width+`px;height:`+this.param.height+`px;">
				<i class="layui-icon layui-icon-down cascader-i" style="top:`+this.param.height/2+`px;"></i>
				` + clearButtonDom + `
				<div class="cascader-model ` + phoneName + `" style="z-index:`+this.store.zIndex+`;display:flex;">
				</div>
			</div>
 		`)

 		// 判断elem是否存在以及是否正确，elem必填
 		if(!options.elem || options.elem == ""){
 			layer.msg('请配置有效的elem值 ')
 		}else if($(options.elem).length == 0){
 			layer.msg('请配置有效的elem值 ')
 		}

		store.input = store.cascaderDom.nextAll().find('.cascader-input')
		store.inputI = store.input.next()
		store.cascaderAll = $(store.cascaderDom.nextAll()[0])
 		store.model = store.cascaderDom.nextAll().find('.cascader-model')
 		store.li = store.model.find('li')
 		if (param.clear) {
 			store.clearButton = store.cascaderAll.find('.cascader-clear')
 			this.clearButtonClick()
 		}
 		// 全局状态初始化
 		store.model.hide()

 		if (store.data.length == 0) {
 			param.getChildren(param.value, data => {
 				store.data = data
 				this.liHtml(store.data)
 				if (param.chooseData) {
		 			if (param.chooseData.length > 0) {
			 			this.dataToshow(param.chooseData)
			 		}
		 		}
 			})
 		} else {
 			this.liHtml(store.data)
 			if (param.chooseData) {
	 			if (param.chooseData.length > 0) {
		 			this.dataToshow(param.chooseData)
		 		}
	 		}
 		}
 		// 先进入是否禁用判断事件
 		// 不禁用则执行下面的事件
 		this.disabled()
 			.then(res => {
 				this.inputClick(options)
 				this.inputHover()
				this.liClick()
				this.liHover()
				this.modelHandle()
				if (param.search.show) {
					this.handleSearch()
				}
 			})
 	}

 	// 判断是否禁用
	Private.prototype.disabled = function() {
		const disabled = this.param.disabled
		const cascaderAll = this.store.cascaderAll
		const input = this.store.input
 		return new Promise((resolve, reject) => {
			if (disabled) {
				cascaderAll.addClass('cascader-disabled')
			}else{
				resolve()
			}
		})
	}

 	// li标签赋值方法
 	// key为string类型
 	Private.prototype.liHtml = function(data, key, choose){
 		let lis=[]
 		let param = this.param
 		let store = this.store
 		let position = []
 		let key1 = ''
 		if (!key || key.length == 0) {
 			key=""
 		} else {
 			key = key.join('-')
 			key1 = key
 			key = key+"-"
 		}
 		if (data !== "") {
 			for (let i in data) {
 				let li = '<li value="'+data[i][param.prop.value]+'" key="'+key+i+'"'
 				if (i == choose) {
 					li = li +' class="cascader-choose-active"'
 					position = [i,data.length]
 				}
 				// 来自于陈诗樵的BUG修复,github地址:https://github.com/alasq
 				// data[i].children 改为 data[i][param.prop.children]
 				if (data[i].hasChild == true || data[i][param.prop.children]) {
 					li = li+'>'+data[i][param.prop.label]+'<i class="layui-icon layui-icon-right"></i></li>'
 				} else {
 					li = li+'>'+data[i][param.prop.label]+'</li>'
 				}
 				lis.push(li)
 			}
 		}
 		lis = lis.join('')
 		if (data && data.length>0){
	 		if (param.search.show && data.length > param.search.minLabel) {
	 			lis = '<input class="layui-input cascader-model-input" key="'+ key1 + '" placeholder="'+ param.search.placeholder +'">' + lis
	 		}
 		} else {
 			lis = '<p class="nodata">暂无数据</p>'
 		}
 		let ul = $(`
			<ul class="cascader-ul">`+lis+`</ul>
		`)
		ul.fadeIn('fast')
		store.model.append(ul)
		this.liPosition(position)
		this.ModelPosition()
 	}

 	// 当前选中的跳转位置
 	// position:['0', 10]，
 	// '0': 代表当前选中的位置，已使用
 	// '10': 代表当前data的长度,暂时未用到
 	Private.prototype.liPosition = function(position) {
 		let currentIndex = Number(position[0])
 		let model = this.store.model.find('ul').last()
 		// ul标签的高度
 		let ulHeight = model.height()
 		// li标签的高度= 自身高度 + margin + padding 高度
 		let liHeight = model.find('li').outerHeight()
 		let minScroll = ulHeight/liHeight
 		if (currentIndex > minScroll) {
 			// model.scrollTop = 0
 			// console.log(model.scrollTop())
 			// = currentIndex * liHeight
 			$(model).animate({
  			scrollTop: currentIndex * liHeight
  		}, 500)
 		}
 	}
 	// 监听清空按钮点击事件
 	Private.prototype.clearButtonClick = function() {
 		let store = this.store
 		let clearButton = this.store.clearButton
 		console.log(clearButton)
 		clearButton.click(()=>{
 			this.store.chooseData = []
 			this.inputValueChange([])
 		})
 	}
 	// 监听搜索事件
 	Private.prototype.handleSearch = function() {
 		let model = this.store.model
 		let prop = this.param.prop
 		let _this = this
 		let value = ''
 		let flag = true
 		model.on('compositionstart',function(){
            flag = false
        })
        model.on('compositionend',function(){
            flag = true
        })
 		model.on('input', 'input', function() {
 			setTimeout(()=>{
	 			if (flag) {
	 				let data = _this.store.data
		 			if (value == this.value) {
		 				return
		 			}
		 			value = this.value
		 			let key = $(this).attr('key').split('-')
		 			let key1 = $(this).attr('key') + '-'
		 			if ($(this).attr('key')) {
						for (i in key) {
							if (data[key[i]][prop.children]){
								data = data[key[i]][prop.children]
							}
						}
					}
		 			let renderData = []
		 			let lis = ''
		 			if (key1 == '-') {
						key1 = ''
					}
					for (i in data) {
						if (data[i][prop.label].indexOf(value) > -1) {
							if (data[i][prop.children] | data[i].hasChild) {
								lis += '<li value="'+data[i][prop.value]+'" key="'+key1+i+'">'+data[i][prop.label]+'<i class="layui-icon layui-icon-right"></i></li>'
							} else {
								lis += '<li value="'+data[i][prop.value]+'" key="'+key1+i+'">'+data[i][prop.label]+'</li>'
							}
							 
							renderData.push(data[i])
						}
					}
					$(this.parentNode).find('li').remove()
					$(this.parentNode).append(lis)
	 			}
	 		}, 0)
 		})
 	}
 	// 监听窗口变化事件
 	Private.prototype.modelHandle = function() {
 		$(window).resize(() => {          //当浏览器大小变化时
		    let model = this.store.model
		    this.ModelPosition()
		})
 	}

 	let modelWidth = 0
 	Private.prototype.ModelPosition = function() {
 		let model = this.store.model
 		let input = this.store.input
 		let BodyWidth = document.documentElement.clientWidth
 		let positionLeft = 0,
 			left = 0
 		if (window.getComputedStyle(model[0]).width !== "auto") {
 			modelWidth = window.getComputedStyle(model[0]).width.replace('px','')
 		}
 		left = input.offset().left - model.position().left
 		if (BodyWidth < modelWidth) {
 			positionLeft = BodyWidth - modelWidth
 		}
 		if (positionLeft < 0) {
 			model.css("left",positionLeft - 30)
 		} else {
 			model.css('left',0)
 		}
 	}
 	
 	// 鼠标hover监听事件[li标签]
 	Private.prototype.liHover = function(){
 		let store = this.store
 		let param = this.param
 		let _this = this
 		store.model.on('mouseenter', 'li', function() {
 			store.parentNextAll = $(this).parent("ul").nextAll()
 			store.brother = $(this).siblings()
 			if ($(this).find('i').length == 0) {
 				store.parentNextAll.fadeOut('fast', function() {
 					store.parentNextAll.remove()
 				})
 			} else {
 				let keys=$(this).attr('key')
 				let value = $(this).attr('value')			
				let data = _this.store.data
				let childrenName = _this.param.prop.children
				keys = keys.split('-')
				let goodData = data

				for (let i in keys) {
					let key = keys[i]
					if (goodData) {
						if (goodData[key]) {
							goodData = goodData[key][childrenName]
						}
					}
					
				}
				
				if (!goodData) {
					param.getChildren(value, datax => {
						goodData = datax
						let children = data
						if (goodData && goodData.length != 0) {
							for (let i in keys) {
								if (i == keys.length - 1) {
									children = goodData
								} else {
									if (!children[keys[i]][childrenName]) {
										children[keys[i]][childrenName] = new Array()
									}
									children = children[keys[i]][childrenName]
								}
							}
							DataTreeAdd(data,goodData,keys)
							store.parentNextAll = $(this).parent("ul").nextAll()
							store.parentNextAll.remove()
							_this.liHtml(goodData, keys)
						} else {
							$(this).find('i').remove()
							store.parentNextAll.remove()
							DataTreeChange(data, keys)
						}
					})									
				} else {
					store.parentNextAll.remove()
					_this.liHtml(goodData, keys)
				}
				// 增加data的树结点
				function DataTreeAdd(data, newData, keys) {
					let array = data
					for (let k in keys) {
						if (k < keys.length -1) {
							array = array[keys[k]][param.prop.children]
						} else {
							array = array[keys[k]]
						}						
					}
					array.children = newData
				}
				function DataTreeChange(data, keys) {
					let array = data
					for (let k in keys) {
						if (k < keys.length -1) {
							array = array[keys[k]][param.prop.children]
						} else {
							array = array[keys[k]]
						}
					}
					array.hasChild = false
				}
								
 			}			
			$(this).addClass('cascader-choose-active')
 			store.brother.removeClass('cascader-choose-active')
 			store.parentNextAll.children().removeClass('cascader-choose-active')

 			// 获取所有的已选中的数据，并回显至input选择框中
 			// _this.getChooseData();
 		});
 	}

 	// 鼠标点击监听事件[li标签]
 	Private.prototype.liClick = function() {
 		let _this = this
 		let store = this.store
 		let param = this.param
 		let className = param.className
 		// store.model为一个自定义dom对象
 		if (param.clicklast == false) {
 			store.model.on('click', 'li', function() {
	 			_this.getChooseData()
	 			store.showCascader = !store.showCascader
	 			if (param.device === 1){
	 				
	 			} else {
	 				store.model.slideUp(_this.param.time)
	 			}
	 			store.inputI.removeClass('rotate')
	 		})
 		} else {
 			store.model.on('click', 'li', function() {
 				store.parentNextAll = $(this).parent("ul").nextAll()
 				if (store.parentNextAll.length == 0) {
 					_this.getChooseData()
		 			store.showCascader = !store.showCascader
		 			if (param.device === 1){
	 				
		 			} else {
		 				store.model.slideUp(_this.param.time)
		 			}
		 			store.inputI.removeClass('rotate')
		 			_this.getThisData()
 				}	 			
	 		})
 		}
 		
 	}

 	// 判断当前访问客户端是PC还是移动端
 	// PC端返回1，移动端返回0
 	Private.prototype.checkDevice = function() {
 		if(/Android|webOS|iPhone|iPod|BlackBerry/i.test(navigator.userAgent)) {
 			return 1
 		} else {
 			return 0
 		}
 	}

 	// 获取当前层级数据
 	Private.prototype.getThisData = function() {
 		let value = this.param.prop.value
 			,children = this.param.prop.children
 			,chooseData = this.store.chooseData
 			,data = this.store.data
 			,currentData = []
 		for (const i in chooseData) {
 			for (const x in data) {
 				if (chooseData[i] == data[x][value]) {
 					if (Number(i) === chooseData.length - 1) {
 						currentData = JSON.parse(JSON.stringify(data[x]))
 						break
 					}
 					if (data[x][children]) {
 						data = data[x][children]
 					} else {
 						data = data[x]
 					}
 					break
 				}
 			}
 		}
 		return currentData
 	}
 	// 鼠标监听事件【input控件hover】
 	Private.prototype.inputHover = function() {
 		let param = this.param
 		let store = this.store

 		// 如果用户配置了清空
 		if (param.clear) {
 			// 监听input框hover事件
 			store.input.hover(function(){
	 			if (store.chooseData.length === 0) {
	 				store.cascaderAll.removeClass('cascader-input-clear')
		 		} else {
		 			store.cascaderAll.addClass('cascader-input-clear')
		 		}
	 		})
 		}

 		
 	}
 	// 鼠标监听事件[input控件click]
 	Private.prototype.inputClick = function(options) {
 		let store = this.store
 		let param = this.param
 		let _this = this
 		$(document).click(function(e) {
 			let className = e.target.className
 			className = className.split(" ")
 			let other = ['cascader-input', 'cascader-model', "cascader-choose-active", "layui-icon-right", "cascader-ul", "cascader-model-input"]
 			for (let i in className) {
 				for (let x in other) {
					if (className[i] == other[x]) {
	 					return
	 				}
 				}
 				
 			}
 			store.showCascader = false
 			store.model.slideUp(_this.param.time)
	 		store.inputI.removeClass('rotate')
 		});
 		// 监听 input 点击事件
 		store.input.click(function() {
 			store.showCascader = !store.showCascader
 			if (store.showCascader == true) {
 				store.inputI.addClass('rotate')				
 				let chooseData = _this.store.chooseData
 				let data = _this.store.data 				
 				if (chooseData.length !== 0) {
	 				let key = []
	 				_this.clearModel()
	 				for (let i in chooseData) {
	 					for (let x in data) {
	 						if (data[x][param.prop.value] == chooseData[i]) {
	 							_this.liHtml(data,key,x)
	 							key.unshift(x)
	 							data = data[x][param.prop.children]
	 							break
	 						}
	 					}
	 				}
 				} else {
 					_this.clearModel()
 					_this.liHtml(data)
 				}
 				store.model.slideDown(_this.param.time)
 				_this.ModelPosition()		
 			} else {
 				store.model.slideUp(_this.param.time)
	 			store.inputI.removeClass('rotate')
 			}
 		})
 	}

	// 获取页面中选中的数据
 	Private.prototype.getChooseData = function() {
 		let store = this.store
 		let chooseDom = store.model.find('li.cascader-choose-active')
 		let chooseData = [];
 		let chooseLabel = [];
 		for(let i in chooseDom){
 			if(chooseDom[i].innerText){
 				chooseData.push($(chooseDom[i]).attr('value'));
 				chooseLabel.push(chooseDom[i].innerText);
 			}else{
 				break;
 			}
 			
 		}
 		this.store.chooseData = chooseData;
 		this.inputValueChange(chooseLabel);
 	}

 	Private.prototype.inputValueChange = function(label){
 		let store = this.store;
 		let param = this.param;
 		if(param.showlast == true){
 			label = label[label.length-1];
 		}else{
 			label = label.join('/');
 		}
 		store.input.val(label);
 		let fontWidth = store.input.css('font-size').replace('px',''),
 			inputWidth = store.input.width(),
 			labelWidth = label.length;
 		let maxLabelWidth = Math.floor(inputWidth/fontWidth);
 		if(labelWidth>maxLabelWidth){
 			store.input.attr('title',label);
 		}else{
 			store.input.attr('title',"");
 		} 		
 	}

 	// 数据回显
 	Private.prototype.dataToshow = function(choosedata){
 		let param = this.param;
 		let store = this.store;
 		let backData = [];			//后端数据集合
 		let chooseLabel=[];			//选中的项对应的label值
 		let keys=[];				//choosedata在数据源中的位置大全
 		backData[0] = store.data;
 		let flag = 1;
 		if(param.getChildren){
 			if (choosedata.length === 1) {
 				for (let i in store.data) {
 					if (store.data[i][param.prop.value] == choosedata[0]) {
 						let label = store.data[i][param.prop.label].split(',')
 						this.inputValueChange(label)
 						return
 					}
 				}	
 			}
 			for(let i=1; i<choosedata.length; i++){
	 			if(i < choosedata.length){
	 				param.getChildren(choosedata[i-1],data=>{
		 				backData[i] = data;
		 				flag++;
		 				if(flag == choosedata.length){
		 					for(let i=choosedata.length -1;i>=0;i--){
					 			for(let x in backData[i]){
					 				if(choosedata[i] == backData[i][x][param.prop.value]){
						 				keys.unshift(x);
						 				chooseLabel.unshift(backData[i][x][param.prop.label])
						 				if(i < choosedata.length -1){
						 					backData[i][x][param.prop.children] = backData[i+1];
						 				}
						 				
						 			}
					 			}	 			
					 		}
					 		store.data = backData[0];

					 		// input框数据回显
					 		this.inputValueChange(chooseLabel);
					 		this.clearModel();
					 		// 选择器数据回显
					 		let key = [];
					 		for(let i in backData){
					 			if(i !== "0"){
					 				key.push(keys[i-1]);
					 			}
					 			this.liHtml(backData[i],key,keys[i]);
					 		}	
		 				}
		 			});
	 			}
	 		}		
 		}else{
 			let storeData = store.data;
 			for(let x in choosedata){
 				for(let i in  storeData){
 					if(storeData[i][param.prop.value] == choosedata[x]){
 						chooseLabel.push(storeData[i][param.prop.label]);
 						keys.push(i)
 						storeData = storeData[i][param.prop.children];
 						break;
 					}
 				}
 			}
 			// input框数据回显
	 		this.inputValueChange(chooseLabel);
	 		this.store.chooseData = choosedata;

 		}
 		
 	}

 	// 清空ul标签
 	Private.prototype.clearModel = function(){
 		let store = this.store;
 		store.model.html('');
 	}

 	// 监听下拉菜单的位置
	Private.prototype.handlePosition = function(){
		// 当前屏幕大小
		// let bodyWidth = 
	}

 	let privates = new Array();
	let dom_num = 0;
 	// 暴露给外界使用的方法
 	let cascader = {

 		// 页面初始化
 		load: function load(options) {
			let current = null
			for (let i in privates) {
				if(privates[i].elem === options.elem){
					current = i
				}
			}
			if (!current) {
				current = dom_num
				dom_num ++
				privates[current] = new Array()
				privates[current].obj = new Private()

			}
			privates[current].elem = options.elem
			privates[current].obj.store.zIndex -= current
			privates[current].obj.store.data = []
			if (options.chooseData) {
				privates[current].obj.store.chooseData = options.chooseData
			} else {
				privates[current].obj.store.chooseData = []
			}
			privates[current].obj.init(options)

    	},

 		// 获取页面中选中的数据，数组形式
 		getChooseData: function(elem){
 			let obj = this.elemCheck(elem);
 			return obj.store.chooseData;
 		},

 		// 监听方法
 		on: function(type,elem,callback){
 			let obj = this.elemCheck(elem)
 			let className = obj.param.className
 			if(type == "click"){
 				$(document).on('click','.' + className + ' li',function(){
 					setTimeout(function(){
 						let data = obj.getThisData()
	 					if(obj.param.clicklast === false){
	 						callback(data)
	 					}else{
	 						if(obj.store.parentNextAll.length == 0){
	 							callback(data)
	 						}
	 					}
 					},50) 					
 				});
 			}else if(type == "hover"){
 				obj.store.model.on('mouseenter','li',function(){
 					callback();
 				});
 			}
 		},

 		// elem位置判断，禁止外界调用，因为你调也没啥卵用
 		elemCheck:function(elem){
 			if(!elem){
 				return privates[0].obj;
 			}
 			for(let i in privates){
 				if(privates[i].elem == elem){
 					return privates[i].obj;
 				}
 			}
 		}
 	}
 	layui.link(layui.cache.base + 'ajaxCascader.css'); 
 	exports('ajaxCascader',cascader);
 });