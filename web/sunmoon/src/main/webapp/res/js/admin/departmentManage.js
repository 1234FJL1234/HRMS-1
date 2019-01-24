layui.config({
    base: "layui/lay/mymodules/"
}).use([ 'table', 'jquery', 'form', 'element',"orgChart" ], function() {
	var table = layui.table;
	var $ = jQuery = layui.jquery;
	var form = layui.form;
	var type = 0;// 操作类型 0新增地点 1查看修改
	var opID = '';// 需要操作的 数据id
	var element = layui.element;
	var orgChart = layui.orgChart;// 组织结构
	// 获取表格数据 getAddsBySE
	var departmentTable = table.render({
		elem : '#department',
		url : 'department/getDepsBySE',
		toolbar : '#toolBar',
		title : '部门表',
		cols : [ [ {
			type : 'checkbox',
			fixed : 'left'
		}, {
			field : 'department_name',
			title : '名称',
			minWidth : 100,
			sort : true
		}, {
			field : 'parent_name',
			title : '所属部门',
			minWidth : 100,
			sort : true
		}, {
			field : 'department_describe',
			title : '描述',
			minWidth : 200
		}, {
			field : 'staff_name',
			title : '管理者',
			minWidth : 100,
			sort : true
		}, {
			field : 'staff_id',
			title : '主管工号',
			minWidth : 100,
			sort : true
		}, {
			title : '操作',
			toolbar : '#opreationBar',
			width : 120
		} ] ],
		page : true
	});
	
	// 获取组织结构
	$.ajax({
		url : "department/getOrgChart",
		type : "get",
		success : function(data) {
			var jsonData=JSON.parse(data);
			// 3表示显示到部门的第3级
			orgChart.render({
				elm : '.orgWrap',
				data : jsonData.data,
				drag : true,
				depth : 3,
				renderdata : function(data, $dom) {
					var value = data;
					if (value && Object.keys(value).length) {
						var $name = $('<div class="name" did="'+value.department_id+'" onclick="orgOnClick('+"'"+value.department_id+"'"+','+"'"+value.department_name+"'"+')"></div>');
						!!(value.department_name) && $name.text(value.department_name);
						$dom.append($name)
						$dom.addClass('organization')
					}
				},
				callback : function() {
				}
			});
		}
	});
	
	// 获取组织结构
	$.ajax({
		url : "staffManage/getAllStaffIdName",
		type : "get",
		success : function(data) {
			var jsonData=JSON.parse(data);
			var op="<option value=''>请选择部门管理人员</option>";
			for(var x in jsonData.data){
				op+="<option value='"+jsonData.data[x].staff_id+"'>"+jsonData.data[x].staff_name+"</option>";
			}
			$("#staff_id").html(op);
			form.render("select");
		}
	});

	// 排序事件
	table.on('sort(department)', function(obj) { // 注：tool是工具条事件名，test是table原始容器的属性
		table.reload('department', {
			initSort : obj // 记录初始排序，如果不设的话，将无法标记表头的排序状态。 layui 2.1.1 新增参数
			,
			where : { // 请求参数（注意：这里面的参数可任意定义，并非下面固定的格式）
				field : obj.field // 排序字段
				,
				order : obj.type
			// 排序方式
			}
		});
	});
	
	// 添加方法
	$('#add-department').on('click', function() {
		type = 0;
		$('#parent_id_show').val("");
		$('#parent_id').val("");
		$('#department_describe').val("");
		$('#department_name').val("");
		$('#adddepartment-change').html('添加');
		$("#staff_id").val("");
		form.render(); // 更新全部000
		$('#add-department').parent().hide();
		$('#back').parent().show();
		$("#table").slideUp('', function() {
			$("#add-department-content").slideDown();
		});
		
	});
	

	// 返回按按钮点击事件
	$('#back').on('click', function() {
		$('#add-department').parent().show();
		$('#back').parent().hide();
		$("#add-department-content").slideUp('', function() {
			$("#table").slideDown();
		});
	
	});

	// 搜索工具 start
	var filter=new Set();// 需要查询的字段
	filter.add("department_id");
	filter.add("department_name");
	filter.add("department_describe");
	filter.add("staff_name");
	filter.add("staff_id");
	// 字段拦截按钮事件
	$('#filter').on('click', function() {
		$("#filter-ul-div").fadeToggle();
	});
	// 字段拦截收起按钮事件
	$('#close-filter').on('click', function() {
		$("#filter-ul-div").fadeToggle();
	});
	// 搜索按钮事件
	$('#search-i').on('click', function() {
		searchAdd($("#serach-address-key").val());
	});
	// 输入框回车事件
	$('#serach-address-key').bind('keypress', function(event) {
		if (event.keyCode == "13") {
			searchAdd($("#serach-address-key").val());
		}
	});
	// 查询字段修改事件
	form.on('checkbox(filter)', function(data) {
		if(data.elem.checked){
			filter.add(data.value);
		}else if (filter.size>1) {
			filter.delete(data.value);
		}else {
			layer.msg("至少选择一个");
			data.elem.checked=true;
			form.render('checkbox');
		}
	});
	// 开始查询
	function searchAdd(key) {
		$("#filter-ul-div").fadeOut();
		table.reload('department', {
			url : 'department/getDepsBySE?key=' + key + '&filter=' + Array.from(filter),
		});
	}
	// 搜索工具 end

	// 监听提交
	form.on('submit(addDepartment)', function(data) {
		var url = "";
		if (type == 1) {
			url = "department/updateDepartment?"
					+ $("#add-department-form").serialize() + "&department_id="
					+ opID;
		} else {
			url = "department/addDepartment?"
					+ $("#add-department-form").serialize();
		}
		$.ajax({
			type : "post",
			url : url,
			async : true,
			success : function(data) {
				var jsonData = JSON.parse(data);
				if (jsonData.code == 100) {
					layer.confirm('已完成', {
						icon : 1,
						title : '提示'
					}, function(index) {
						layer.close(index);
						window.location.href = window.location.href;
					});
				} else if (jsonData.code == 101) {
					layer.confirm('身份已过期，请重新登录', {
						icon : 2,
						title : '提示'
					}, function(index) {
						layer.close(index);
						window.location.href = "gotoLogin";
					});
				} else if (jsonData.code == 102) {
					layer.msg("访问受限，权限不足");
				} else {
					layer.msg("未知错误");
				}
			},
			error : function(jqObj) {

			}
		});
		return false;
	});
	// 头工具栏事件
	table.on('toolbar(department)', function(obj) {
		var checkStatus = table.checkStatus(obj.config.id);
		switch (obj.event) {
		case 'delChecked':
			var data = checkStatus.data;
			layer.prompt({
				formType : 1,
				value : '',
				title : '验证密码',
				maxlength : 20,
			}, function(value, index, elem) {
				layer.close(index);
				if (varifyPass(value)) {
					var ids = new Array();
					for ( var x in data) {
						ids[x] = data[x].department_id;
					}
					delAdds(ids);
				}
			});
			break;
		}
		;
	});

	// 监听行工具事件
	table.on('tool(department)', function(obj) {
		var data = obj.data;
		// console.log(obj)
		if (obj.event === 'del') {
			layer.prompt({
				formType : 1,
				value : '',
				title : '验证密码',
				maxlength : 20,
			}, function(value, index, elem) {
				layer.close(index);
				if (varifyPass(value)) {
					delAdds(data.department_id);
				}
			});
		} else if (obj.event === 'edit') {
			type = 1;// 查看与编辑
			opID = data.department_id;// 操作数据id
			$('#department_describe').val(data.department_describe);
			$('#department_name').val(data.department_name);
			$('#adddepartment-change').html('修改');
			$("#staff_id").val(data.staff_id);
			form.render(); // 更新全部000
			$("#table").slideUp('', function() {
				$("#add-department-content").slideDown();
			});
			$('#parent_id_show').val(data.parent_name+" ["+data.parent_id+"]");
			$('#parent_id').val(data.parent_id);
			$('#add-department').parent().hide();
			$('#back').parent().show();
		}
	});
	
	// 批量删除地址
	function delAdds(ids) {
		$.ajax({
			type : "post",
			url : "department/delDepartment?ids=" + ids,
			async : true,
			success : function(data) {
				var jsonData = JSON.parse(data);
				if (jsonData.code == '100') {
					layer.msg('已完成', {
						icon : 1,
						time : 2500
					}, function() {
						window.location.reload();
					});
				}else if (jsonData.code == 102) {
					layer.msg("访问受限，权限不足");
				} else {
					layer.msg("未知错误", {
						icon : 2
					});
				}
			},
			error : function(jqObj) {

			}
		});
		return false;
	}

	// 验证账号密码
	function varifyPass(pass) {
		var re = false;
		$.ajax({
			type : "post",
			url : "verifyStaff?staff_password=" + pass,
			async : false,
			success : function(data) {
				var jsonData = JSON.parse(data);
				if (jsonData.code == 100) {
					re = true;
				} else if (jsonData.code == 101) {
					layer.msg("密码验证不通过", {
						icon : 4
					});
				} else if (jsonData.code == 102) {
					layer.msg('身份已过期，请重新登录', {
						icon : 2,
						time : 2500
					}, function() {
						window.location.href = "gotoLogin";
					});
				} else {
					layer.msg("未知错误", {
						icon : 2
					});
				}
			},
			error : function(jqObj) {

			}
		});
		return re;
	}


	// 重载表格 防止拉伸
	window.reloadTable = function() {
		departmentTable.reload();
	};
	
	// 组织结构
	window.orgOnClick=function(id,name) {
		if(opID==id){
			layer.msg("不可以选择自身作为父级");
		}else{
			$('#parent_id_show').val(name+" ["+id+"]");
			$('#parent_id').val(id);
		}
		
	}
	
	form.render();
	
});