/**
 * @Name: 基于layui的异步无限级联选择器
 * @Author: 罗茜
 * 创建时间: 2019/05/23
 * 修改时间：2019/05/27 ----- 2019/05/28
 * 使用说明: 在主文件里面使用layui.config设置，具体方法看index.html
 */

 /**
 * 参数说明：
 * 			width（可选） :input框宽度
 *			height（可选）：input框高度
 */
 layui.define(["jquery"],(exports)=>{
 	let $ = layui.jquery;

 	// 私有方法，禁止外面调用的方法
 	function Private(){
 		//页面初始化默认值
 		this.param = {   
 			width:220,
 			height:40,
 			prop:{
 				value:"value",
 				label:"label",
 				children:'children'
 			},
 			time:250
 		},
 		// 定义全局状态仓库
 		this.store = {
	 		showCascader:false,
	 		cascaderDom:null,					// 当前elem对象
	 		input:null,							// input框dom
	 		inputI:null,						// input框箭头dom
	 		model:null,							// 下拉菜单的主dom
	 		li:null,							// li标签
	 		parentNextAll:null,					// 当前操作的li标签元素后面所有ul集合
	 		brother:null,						// li标签同级dom集合
	 		data:[],							// 所有从后端异步请求的数据集合
	 		chooseData:[],						// 已选中的数据集
	 	}
 	}

 	// 页面初始化
 	Private.prototype.init = function(options){
 		let store = this.store;
 		let param = this.param;
 		// 把用户的参数值进行存储
 		for(let i in options){
 			if(options[i].length !== 0){
 				if(i == "prop"){
 					for(let x in options[i]){
 						param[i][x] = options[i][x];
 					}
 				}else{
 					param[i] = options[i];
 				}
 			}
 		}
 		delete param.data;
 		if(options.data){
 			store.data = options.data;
 		}
 		// 存储结束
 		// 判断elem是否存在以及是否正确，elem必填
 		if(!options.elem || options.elem == ""){
 			layer.msg('请配置有效的elem值 ')
 		}else if($(options.elem).length == 0){
 			layer.msg('请配置有效的elem值 ')
 		}
 		if(store.data.length == 0){
 			store.data = param.getChildren(param.value)
 		}
 		// dom变量初始化
 		store.cascaderDom = $(options.elem);
 		

 		// 渲染主dom
 		store.cascaderDom.after(`
			<div class="cascader-all" style="width:`+this.param.width+`px;">
				<input type="text" class="layui-input cascader-input" placeholder="请选择" readonly style="width:`+this.param.width+`px;height:`+this.param.height+`px;">
				<i class="layui-icon layui-icon-down cascader-i" style="top:`+this.param.height/2+`px;"></i>
				<div class="cascader-model">
				</div>
			</div>
 		`);

		store.input = store.cascaderDom.nextAll().find('.cascader-input');
		store.inputI = store.input.next();
 		store.model = store.cascaderDom.nextAll().find('.cascader-model');
 		store.li = store.model.find('li');
 		// 全局状态初始化
 		store.model.hide();
 		// li标签初始化
 		this.liHtml(store.data);

 		this.inputClick(options);
 		this.liClick();	
 		this.liHover();	
 		if(param.checkData){
 			if(param.checkData.length > 0){
	 			this.dataToshow(param.checkData);
	 		}
 		}
	 			
 	}

 	// li标签赋值方法
 	// key为string类型
 	Private.prototype.liHtml = function(data,key,choose){
 		let lis=[];
 		let param = this.param;
 		let store = this.store;
 		if(!key || key.length == 0){
 			key=""
 		}else{
 			key = key.join('-');
 			key=key+"-";
 		}
 		if(data !== ""){
 			for(let i in data){
 				let li = '<li '+param.prop.value+'="'+data[i][param.prop.value]+'" key="'+key+i+'"';
 				if(i == choose){
 					li = li +' class="cascader-choose-active"';
 				}
 				if(data[i].hasChild == true || data[i].children){
 					li = li+'>'+data[i][param.prop.label]+'<i class="layui-icon layui-icon-right"></i></li>';
 				}else{
 					li = li+'>'+data[i][param.prop.label]+'</li>';
 				}
 				lis.push(li);
 			}
 		}
 		lis = lis.join('');
 		let ul = $(`
			<ul class="cascader-ul">`+lis+`</ul>
		`);
		ul.fadeIn('fast');
		store.model.append(ul); 
 	}

 	// 鼠标hover监听事件[li标签]
 	Private.prototype.liHover = function(){
 		let store = this.store;
 		let param = this.param;
 		let _this = this;
 		store.model.on('mouseenter','li',function(){
 			store.parentNextAll = $(this).parent("ul").nextAll();
 			store.brother = $(this).siblings();
 			if($(this).find('i').length == 0){
 				store.parentNextAll.fadeOut('fast',function(){
 					store.parentNextAll.remove();
 				})
 			}else{
 				let keys=$(this).attr('key');

 				let value = $(this).attr('value');
				store.parentNextAll.remove();				
				let data = _this.store.data;
				let childrenName = _this.param.prop.children;
				keys = keys.split('-');
				let goodData = data;
				let ulRender = true;

				for(let i in keys){
					let key = keys[i];
					if(goodData){
						if(goodData[key]){
							goodData = goodData[key][childrenName];
						}
					}
					
				}
				if(!goodData || goodData.length == 0){
					goodData = param.getChildren(value);
					let children = data;
					if(goodData){
						for(let i in keys){
							if(i == keys.length - 1){
								children = goodData;
							}else{
								children = children[i][childrenName];
							}
						}
						DataTreeAdd(data,goodData,keys);
					}else{
						$(this).find('i').remove();
						store.parentNextAll.remove();
						DataTreeChange(data,keys);
						ulRender = false;
					}
					
				}
				if(ulRender == true){
					_this.liHtml(goodData,keys);
				}
				// 增加data的树结点
				function DataTreeAdd(data,newData,keys){
					let array = data;
					for(let k in keys){
						if(k < keys.length -1){
							array = array[keys[k]][param.prop.children];
						}else{
							array = array[keys[k]];
						}						
					}
					array.children = newData;
				}
				function DataTreeChange(data,keys){
					let array = data;
					for(let k in keys){
						if(k < keys.length -1){
							array = array[keys[k]][param.prop.children];
						}else{
							array = array[keys[k]];
						}
					}
					array.hasChild = false;
				}
								
 			}			
			$(this).addClass('cascader-choose-active');
 			store.brother.removeClass('cascader-choose-active');
 			store.parentNextAll.children().removeClass('cascader-choose-active');

 			// 获取所有的已选中的数据，并回显至input选择框中
 			// _this.getChooseData();
 		});
 	}
 	// 鼠标点击监听事件[li标签]
 	Private.prototype.liClick = function(){
 		let _this = this;
 		let store = this.store;
 		// store.model为一个自定义dom对象
 		// mouseenter能正常执行程序
 		// click则不行
 		// store.model.on('mouseenter','li',function(){
 		store.model.on('click','li',function(){
 			_this.getChooseData();
 			store.showCascader = !store.showCascader;
 			store.model.slideUp(_this.param.time);
 		});
 	}

 	// 鼠标监听事件[input控件]
 	Private.prototype.inputClick = function(options){
 		let store = this.store;
 		let _this = this;
 		$(document).click(function(e){
 			let className = e.target.className;
 			className = className.split(" ");
 			let other = ['cascader-input','cascader-model',"cascader-choose-active","layui-icon-right","cascader-ul"];
 			for(let i in className){
 				for(let x in other){
					if(className[i] == other[x]){
	 					return;
	 				}
 				}
 				
 			}
 			store.showCascader = false;
 			store.model.slideUp(_this.param.time);
	 		store.inputI.removeClass('rotate');
 		});
 		store.input.click(function(){
 			store.showCascader = !store.showCascader;
 			if(store.showCascader == true){
 				store.model.slideDown(_this.param.time);
	 			store.inputI.addClass('rotate');
 			}else{
 				store.model.slideUp(_this.param.time);
	 			store.inputI.removeClass('rotate');
 			}
 		})
 	}

	// 获取页面中选中的数据
 	Private.prototype.getChooseData = function(){
 		let store = this.store;
 		let chooseDom = store.model.find('li.cascader-choose-active');
 		let chooseData = [];
 		let chooseLabel = [];
 		for(let i in chooseDom){
 			if(chooseDom[i].innerText){
 				chooseData.push($(chooseDom[i]).attr(this.param.prop.value));
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
 	}
 	// 数据回显
 	Private.prototype.dataToshow = function(checkData){
 		let param = this.param;
 		let store = this.store;
 		let backData = [];			//后端数据集合
 		let chooseLabel=[];			//选中的项对应的label值
 		let keys=[];				//checkData在数据源中的位置大全
 		if(!store.data){
 			backData[0] = param.getChildren(param.value);
 		}else if(store.data.length == 0){
 			backData[0] = param.getChildren(param.value);
 		}else{
 			backData[0] = store.data;
 		}
 		for(let i=1;i<checkData.length;i++){
 			if(i < checkData.length){
 				backData[i] = param.getChildren(checkData[i-1]);
 			}
 		}
 		for(let i=checkData.length -1;i>=0;i--){
 			for(let x in backData[i]){
 				if(checkData[i] == backData[i][x][param.prop.value]){
	 				keys.unshift(x);
	 				chooseLabel.unshift(backData[i][x][param.prop.label])
	 				if(i < checkData.length -1){
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
 	// 清空ul标签
 	Private.prototype.clearModel = function(){
 		let store = this.store;
 		store.model.html('');
 	}

 	let private = new Private();

 	// 暴露给外界使用的方法
 	let cascader = {
 		// 页面初始化
 		load:function(options){
 			private.init(options);
 		},
 		// 获取页面中选中的数据，数组形式
 		getChooseData:function(){
 			return private.store.chooseData;
 		},
 		// 监听方法
 		on:function(type,callback){
 			if(type == "click"){
 				private.store.model.on('click','li',function(){
 					callback();
 				});
 			}else if(type == "hover"){
 				private.store.model.on('mouseenter','li',function(){
 					callback();
 				});
 			}
 		}
 	}

 	exports('ajaxCascader',cascader);
 });