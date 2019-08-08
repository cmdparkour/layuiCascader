# layuiCascader
@Name: 基于layui的ajax异步无限级联选择器

@Author: 前端喵

@Blog:http://blog.51weblove.com

创建时间: 2019/05/23

修改时间：2019/05/27 ----- 2019/05/28	----- 2019/05/29 ----- 2019/05/30

使用说明: 在主文件里面使用layui.config设置，具体方法看index.html

## 使用说明

### 一、Demo

[查看demo](http://blog.51weblove.com/demo/layuiAjaxCascader/index.html)

[更新日志](https://fly.layui.com/extend/ajaxCascader/)

此插件主要用来实现数据异步加载功能，具体使用方法，请参照index.html

优点：

1.已获取到的数据不再重复获取

2.回显功能只需一个参数即可

3.自动宽度，完美显示所有的文字

4.简单配置即可实现插件的使用

```
 ├─layui /layui 基础框架
 │─mods //存放第三方组件的目录
      └─cascader
        ├─cascader.js //组件核心 JS 库【转换为es5】
        ├─cascader.src.js //开发时使用的js文件
        └─cascader.css //组件 CSS 库
 |-index.html //演示demo【包含最简调用模式】
```

### 二、定义配置项options

```
let options={           	
    elem:'#demo'                              //【必填】dom对应的id值或class值，最好为id
    ,width:100                                //【可选】input框宽度  【默认：220】  
    ,height:50                                //【可选】input框高度  【默认：40】
    ,placeholder:"请选择您的最佳伴侣"	      //【可选】input框placeholder值 【默认：请选择】
    ,prop:{
         value:'value',                       //【可选】定义接口需要取得的值的名称字段【默认:value】
         label:'label',                       //【可选】定义接口显示的名称字段  【默认：label】
         children:'children'                  //【可选】定义接口子集的名称字段 【默认：children】
    }
    ,search: {							    // 【1.5新增】
        show: true,                           // 【可选】是否显示search功能【默认：false】
        minLabel: 5,                          // 【可选】元素超过多少个时显示搜索框【默认：10】
        placeholder: "请输入关键词"            // 【可选】搜索框的提示信息【默认：请输入关键词】
    }
    ,showlast:false                           //【可选】是否只显示最后一级 【默认：false】
    ,clicklast:false			             //【可选】点击最后一级才选择数据
    ,disabled:false                           //【可选】是否禁用当前组件
    ,data:[]                                  //【二选一】初始化的值
    ,value:0                                  //【二选一】ajax请求初始值,即获取根结点的初始请求参数

    ,getChildren:function(value){             //【可选】用户自定义获取data子集的方法,
        let data = [];                        // value为当前dom的value值
        $.ajax({                         
            url:'https://open.gog.cn/appz/region/getRegion/'+value,
            type:'get',
            async:false,
            success:(res)=>{
                data = res.data;
                for(let i in data){
                    data[i].value = data[i].id;
                    data[i].label = data[i].name;
                    delete data[i].id;
                    delete data[i].name;
                    data[i].hasChild = true;
                }
            }
        });
        return data;
    }
    ,checkData:['520000000000','520300000000','520302000000']  //回显参数               
}
```

## 三、初始化Cascader

```
cascader.load(options);
```

## 四、方法

```
cascader.getChooseData()						
// 其返回值用一个变量存储即可
// 返回类型：数组
// 返回元素：所有已选择的value值
// ['520000000000','520300000000','520302000000']
```

```
// 选择器点击事件的监听
cascader.on('click',function(){
	
});
// 选择器hover事件的监听
cascader.on('hover',function(){
	
});
```

## 五、最简调用模式

```
// 直接赋值模式
cascader.load({
	elem:'#demo2'                        
	,data:[
		{value:123,label:456,children:[
			{value:789,label:"子集"}
		]},
		{value:240,label:"第一层"},
		{value:250,label:"第一层"},
		{value:260,label:"第一层"},
		{value:280,label:"第一层"},
	]
});
```

```
// Ajax传参模式
cascader.load({
	elem:'#demo1'                          
	,value:0  
	,getChildren:function(value,callback){  
		var data = [];                  
		$.ajax({                         
			url:'https://open.gog.cn/appz/region/getRegion/'+value,
			type:'get',
			success:function(res){
				data = res.data;
				for(var i in data){
					data[i].value = data[i].id;
					data[i].label = data[i].name;
					delete data[i].id;
					delete data[i].name;
					data[i].hasChild = true;
				}
				callback(data);
			}
		});
	}      
});
```

