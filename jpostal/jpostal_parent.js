/*************************************************************
「郵便番号から住所検索」の親ウィンドウ側の処理

Copyright (c) 2003-2014 Aoki Makoto, Ninton G.K.
http://www.ninton.co.jp

private 変数

public 関数
	new    JPOSTAL_PARENT_O()
	       
	void   JPOSTAL_parent_set_form()
*************************************************************/
/*============================================================
 * public 変数
 *============================================================*/


/*============================================================
 * private 
 *============================================================*/
var _jpostal_parent_array = new Array();


/*============================================================
 * public 関数
 *============================================================*/
function JPOSTAL_PARENT_O(i_ID)
{
	this.ID         = 0;
	this.KEN_ALL    = 1;
	this.JIGYOSYO   = 0;
	this.LIMIT      = -1;
	this.FORMAT     = '%0-%1 %2 %3 %4';
	this.AUTO_RETURN_TYPE = 0;
	this.WINDOW_URL      = 'jpostal_child.html';
	this.WINDOW_NAME     = 'jpostal';
	this.WINDOW_FEATURES = 'width=400,height=250,scrollbars=1,resizable=1';
	this.FORM = 0;
	this.ELEMENT_FORMAT = new Object();
	this.callback = 'JPOSTAL_PARENT_output_result';
	this.POSTCODE    = '';
	
	if (typeof(i_ID) == 'number')
	{
		this.ID = i_ID;
	}
	_jpostal_parent_array[this.ID] = this;
	
	
	this.main = function ()
	{
		var name0;
		var name1;
		var querystring;
		
		name0 = this.find_element('%0');
		name1 = this.find_element('%1');
		this.POSTCODE = this.input_postcode(name0, name1);
		
		querystring = this.calculate_querystring();
		this.open_window(querystring);
	}
	
	this.find_element = function (i_format)
	{
		if (i_format.length != 2)
		{
			return '';
		}
		
		for (var name in this.ELEMENT_FORMAT)
		{
			if ( 0 <= this.ELEMENT_FORMAT[name].indexOf(i_format) )
			{
				return name;
			}
		}
		
		return '';
	}
	
	this.input_postcode = function (i_name0, i_name1)
	{
		var docform;
		var postcode0 = '';
		var postcode1 = '';
		
		docform = document.forms[this.FORM];
		
		if (i_name0 != '')
		{
			postcode0 = docform.elements[i_name0].value;
		}

		if (i_name1 != '' && i_name1 != i_name0)
		{
			postcode1 = docform.elements[i_name1].value;
		}

		return postcode0 + postcode1;
	}
	
	
	this.calculate_querystring = function ()
	{
		var names = new Array(
			'ID',
			'POSTCODE',
			'KEN_ALL',
			'JIGYOSYO',
			'FORMAT',
			'LIMIT',
			'AUTO_RETURN_TYPE',
			'callback'
			);

		var vars;
		var esc_vars;
		var querystring;
		
		vars = new Object();
		for (var i = 0; i < names.length; i++)
		{
			vars[ names[i] ] = this[ names[i] ];
		}

		esc_vars   = MW_escape_vars(vars);
		querystring = MW_calculate_querystring(esc_vars);
		
		return querystring;
	}
	
	
	this.open_window = function (i_querystring)
	{
		var wnd;

		/* 欠陥番号2
		 * window.openではURL空欄にし、window.locationでURL指定すること
		 * window.openでURL指定すると、Mac版NN4.7 で問題がある
		 * 子ウィンドウのスクリプトで、document.write('<SCRIPT src=xxx>')をしているためか？
		 */
		 
		wnd = window.open(
			'',
			this.WINDOW_NAME,
			this.WINDOW_FEATURES
			);

		wnd.location = this.WINDOW_URL + '?' + i_querystring;
			
		wnd.focus();
	}


	this.output_result = function (i_address_value)
	{
		var value;

		if (i_address_value == '')
		{
			return;
		}
		
		for (var name in this.ELEMENT_FORMAT)
		{
			value  = JPOSTAL_format(this.ELEMENT_FORMAT[name], i_address_value);
			
			if (this.ELEMENT_FORMAT[name] == '%2' && document.forms[this.FORM].elements[name].type == 'select-one')
			{
				MW_set_prefecture_value(document.forms[this.FORM].elements[name], value);
			}
			else
			{
				MW_set_form_value(document.forms[this.FORM].elements[name], value);
			}
		}
		
		return;
	}
}


// 子ウィンドウから呼ばれる関数
//
// 子ウィンドウが実行起点なので、子ウィンドウと親ウィンドウの文字コードが異なる場合、
// ブラウザによっては、文字化けなどの問題がおきるかもしれない。
// 親ウィンドウのフォームに値を代入したとき、
// 「子ウィンドウの文字コードで表示する」と文字化けの可能性あり

function JPOSTAL_PARENT_output_result(i_id, i_address_value)
{
	var jpp_obj;
	
	jpp_obj = _jpostal_parent_array[i_id];
	jpp_obj.output_result(i_address_value);
}



//EOF
