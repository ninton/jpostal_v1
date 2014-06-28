/*************************************************************
MW web studio製ライブラリ

Copyright (c) 2003-2014 Aoki Makoto, Ninton G.K.
http://www.ninton.co.jp
*************************************************************/
function MW_script_src(i_url)
{
	var tag;
	tag = '<' + 'script src="' + i_url + '"><' + '/script>';
	return tag;
}

function MW_escape_vars(i_vars)
{
	var vars = new Object();
	var esc_name;
	var esc_value;
	
	for (var name in i_vars)
	{
		esc_name  = escape(name);
		esc_value = escape(i_vars[name]);
		
		vars[ esc_name ] = esc_value;
	}
	
	return vars;
}


function MW_calculate_querystring (i_vars)
{
	var arr;
	var i;
	var querystring;
	
	arr = new Array();
	i = 0;
	
	for (var name in i_vars)
	{
		arr[i] = name + '=' + i_vars[name];
		++i;
	}
	
	querystring = arr.join('&');
	
	return querystring;
}


function MW_set_form_value(io_element, i_value)
{
	switch (io_element.type)
	{
	case 'select-one':
	case 'select-multiple':
		for (var i = 0; i < io_element.options.length; ++i)
		{
			io_element.options[i].selected = (io_element.options[i].value == i_value);
		}
		break;

	case 'text':
		io_element.value = i_value;
		break;
	
	case 'textarea':
		io_element.value = i_value;
		break;
		
	case 'checkbox':
	case 'radio':
	default:
		break;
	}
}


function MW_set_prefecture_value(io_element, i_value)
{
	// i_value は、全て '都道府県' つきとすること
	//
	// ＜OPTION value=東京都＞東京都
	//                ~~~~~~
	// ＜OPTION value=13＞東京都
	//                    ~~~~~~
	// ＜OPTION value=東京＞東京
	//                ~~~~
	// ＜OPTION value=13＞東京
	//                    ~~~~
	
	var short_value;
	var selected;
	
	short_value = i_value.replace(/[都府県]$/, '');
	
	switch (io_element.type)
	{
	case 'select-one':
	case 'select-multiple':
		for (var i = 0; i < io_element.options.length; ++i)
		{
			selected = false;
			
			     if (io_element.options[i].value == i_value    ) { selected = true; }
			else if (io_element.options[i].text  == i_value    ) { selected = true; }
			else if (io_element.options[i].value == short_value) { selected = true; }
			else if (io_element.options[i].text  == short_value) { selected = true; }
			
			io_element.options[i].selected = selected;
		}
		break;

	case 'text':
		io_element.value = i_value;
		break;
	
	case 'textarea':
	case 'checkbox':
	case 'radio':
	default:
		break;
	}
}


function MW_parse_string(i_string)
{
	var vars = new Object();
	var arr  = i_string.split(/[?&]/g);
	
	var name;
	var value;
	
	for (var i = 0; i < arr.length; ++i)
	{
		if (arr[i] == '') continue;
		
		var n = arr[i].search('=');
		if (n < 0)
		{
			name  = arr[i];
			value = '';
		}
		else
		{
			name  = arr[i].substr(0, n);
			value = arr[i].substr(n+1);
		}

		name  = unescape(name);
		value = unescape(value);
		
		vars[name] = value;
	}
	
	return vars;
}

function MW_array_map( i_func, i_arr )
{
	for (var i = 0; i < i_arr.length; i++)
	{
		i_func(i_arr[i]);
	}
}
	
function MW_array_grep( i_func, i_arr )
{
	var arr = new Array();
	var j = 0;
	
	for (var i = 0; i < i_arr.length; i++)
	{
		if ( i_func(i_arr[i]) )
		{
			arr[j] = i_arr[i];
			++j;
		}
	}
	
	return arr;
}
	
function MW_find_window(i_func_name)
{
	var window_array = new Array();
	var n = 0;
	
	if (window.opener)
	{
		// 子ウィンドウ
		window_array[n] = window.opener;
		n++;
	}

	if (window.parent)
	{
		// インナーフレーム
		window_array[n] = window.parent;
		n++;
	}
	
	if (window.parent && window.parent.frames)
	{
		// フレーム
		// 入れ子のフレームには対応していない
		for (var i = 0; i < window.parent.frames.length; ++i)
		{
			window_array[n] = window.parent.frames[i];
			n++;
		}
	}
	
	
	for (var i = 0; i < window_array.length; i++)
	{
		if ( window_array[i][i_func_name] )
		{
			return window_array[i];
		}
	}
	
	return 0;
}

function MW_UNIT_TEST_O()
{
	this.window  = window.open('', '_blank');
	this.sub_cnt = 0;
	this.test_cnt = 0;
	this.ok_cnt = 0;
	this.ng_cnt = 0;
	
	this.main = function ()
	{
		this.print( new Date()      + "\n");
		this.print( window.location + "\n" );
		
		for (var name in this)
		{
			if ( 0 <= name.search(/^test/) && typeof(this[name]) == 'function')
			{
				this.print( "\n" + name + "\n");
				this.sub_cnt = 1;
				this[name]();
			}
		}
		
		this.print( '<hr>' );
		this.print( 'TEST=' + this.test_cnt + "\n");
		this.print( 'OK='   + this.ok_cnt   + "\n");
		this.print( 'NG='   + this.ng_cnt   + "\n");
		
	}
	
	this.print = function (i_str)
	{
		this.window.document.write(i_str.replace(/[\n]/g, "<br>\n"));
	}
	
	this.assert = function (i_cond)
	{
		var result = i_cond ? 'OK' : 'ng';

		this.print(this.sub_cnt + ':' + result + ' ');
		this.sub_cnt ++;

		this.test_cnt ++;
		if (i_cond)
		{
			this.ok_cnt ++;
		}
		else
		{
			this.ng_cnt ++;
		}
		
	}
}


