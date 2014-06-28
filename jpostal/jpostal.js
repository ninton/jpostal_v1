/*************************************************************
# 郵便番号から住所を検索します
#
# Copyright (c) 2003-2014 Aoki Makoto, Ninton G.K.
# http://www.ninton.co.jp
#
error
	0	正常
	1	郵便番号が見つかりませんでした
	2	郵便番号に数字以外の文字があります
	3	郵便番号が３桁未満です
	4	郵便番号が７桁を超えています
	5	郵便データディレクトリが見つかりません
	6	検索結果がｘ件を越えました。

private 変数
	object _jpostal;
	
public 関数
	integer JPOSTAL_error()
	string  JPOSTAL_error_message(i_error)
	string  JPOSTAL_format(i_format, i_addr_value)
	array   JPOSTAL_select(i_args)
	string  JPOSTAL_z2h(i_str)
*************************************************************/

/*============================================================
 * public 定数
 *============================================================*/


/*============================================================
 * private 変数
 *============================================================*/
var _jpostal = new Object();

	_jpostal.KEN_ALL  = 1;
	_jpostal.JIGYOSYO = 0;
	_jpostal.LIMIT    = -1;
	_jpostal.MAXLEN   = 7;
	_jpostal.MINLEN   = 3;
	_jpostal.POSTCODE = '';
	_jpostal.preformat = 1;

	_jpostal.is_selected  = false;
	_jpostal.error = 0;

/*============================================================
 * public 関数
 *============================================================*/
function JPOSTAL_error()
{
	return _jpostal.error;
}


function JPOSTAL_error_message(i_error)
{
	var err_msg = '';

	switch (i_error)
	{
	case 0:	err_msg = '正常終了';					break;
	case 1:	err_msg = '郵便番号が見つかりませんでした。';		break;
	case 2:	err_msg = '郵便番号に数字以外の文字があります';		break;
	case 3:	err_msg = '郵便番号が' + _jpostal.MINLEN + '桁未満です';			break;
	case 4:	err_msg = '郵便番号が' + _jpostal.MAXLEN + '桁を超えています';	break;
	case 5:	err_msg = '郵便データファイルが見つかりません';	break;
	case 6:	err_msg = '検索結果が' + _jpostal.LIMIT + '件を越えました。';	break;
	default:err_msg = '不明なエラーです';				break;
	}

	return err_msg;
}


function JPOSTAL_format(i_format, i_addr_value)
{
	var field_arr;
	var field_index;
	var dst_str, src_str;
	var pos;
	var left_str, match_str, right_str;
	var replace_str;
	var ch;

	var ch_upper_A = 'A';
	var CHARCODE_UPPER_A = ch_upper_A.charCodeAt(0);
	var ch_lower_a = 'a';
	var CHARCODE_LOWER_A = ch_lower_a.charCodeAt(0);
	
	field_arr = i_addr_value.split(',');

	dst_str = '';
	src_str = i_format;
	
	while ( src_str != '' && 0 <= (pos = src_str.indexOf('%')) )
	{
		left_str  = src_str.substr(0,    pos);
		match_str = src_str.substr(pos,  2);
		right_str = src_str.substr(pos+2 );

		// 左側文字列
		dst_str = dst_str + left_str;

		//一致文字列
		ch = match_str.substr(1,1);
		replace_str = '';

		if ( ch == '*' )
		{
			replace_str = i_addr_value;
		}
		else if ( ch == '%' )
		{
			replace_str = ch;
		}
		else
		{
			field_idx = -1;
			
			if ( '0' <= ch && ch <= '9' )
			{
				field_idx = ch;
			}
			else if ( 'A' <= ch && ch <= 'Z' )
			{
				field_idx = 10 + ch.charCodeAt(0) - CHARCODE_UPPER_A;
			}
			else if ( 'a' <= ch && ch <= 'z' )
			{
				// 0x61 は、'a' のアスキーコード
				field_idx = 10 + ch.charCodeAt(0) - CHARCODE_LOWER_A;
			}

			if (field_idx != -1)
			{
				if (field_idx < field_arr.length)
				{
					replace_str = field_arr[field_idx];
				}
			}
		}
		dst_str = dst_str + replace_str;
		
		// 右側文字列
		src_str = right_str;
	}
	
	dst_str = dst_str + src_str;

	return dst_str;
}


function JPOSTAL_select(i_args)
{
	var addr_value_arr = new Array();
	var buf_arr;

	_jpostal.error = 0;
	_jpostal.is_selected = false;

	_JPOSTAL_get_arguments(i_args);
	
	_JPOSTAL_check_postcode();
	if (_jpostal.error)
	{
		return addr_value_arr;
	}
	
	buf_arr = _JPOSTAL_load();
	if (_jpostal.error)
	{
		// 郵便データファイルが見つかりません
		return addr_value_arr;
	}
	if ( _jpostal.is_selected )
	{
		addr_value_arr = buf_arr;
	}
	else
	{
		addr_value_arr = _JPOSTAL_select(buf_arr);
	}
	
	if (_jpostal.preformat)
	{
		_JPOSTAL_preformat(addr_value_arr);
	}
	
	if (addr_value_arr.length == 0)
	{
		// 郵便番号が見つかりませんでした
		_jpostal.error = 1;
		return addr_value_arr;
	}
	
	if (0 <= _jpostal.LIMIT)
	{
		if (_jpostal.LIMIT < addr_value_arr.length)
		{
			// xx 件以上見つかりました。
			_jpostal.error = 6;
		}
	}
	
	return addr_value_arr;
}


function JPOSTAL_z2h(i_str)
{
	var s = i_str;

	s = s.replace(/０/g, '0');
	s = s.replace(/１/g, '1');
	s = s.replace(/２/g, '2');
	s = s.replace(/３/g, '3');
	s = s.replace(/４/g, '4');
	s = s.replace(/５/g, '5');
	s = s.replace(/６/g, '6');
	s = s.replace(/７/g, '7');
	s = s.replace(/８/g, '8');
	s = s.replace(/９/g, '9');
	s = s.replace(/[ー－]/g, '-');

	return s;
}

/*============================================================
 * private 関数
 *============================================================*/
function _JPOSTAL_get_arguments(i_args)
{
	_jpostal.KEN_ALL  = 1;
	_jpostal.JIGYOSYO = 0;
	_jpostal.LIMIT    = -1;
	_jpostal.MAXLEN   = 7;
	_jpostal.MINLEN   = 3;
	_jpostal.POSTCODE = '';
	_jpostal.preformat = 1;

	var names = new Array(
		'KEN_ALL',
		'JIGYOSYO',
		'LIMIT',
		'MAXLEN',
		'MINLEN',
		'POSTCODE',
		'preformat'
		);
		
	for (var i = 0; i < names.length; ++i)
	{
		if ( typeof(i_args[names[i]]) != 'undefined')
		{
			_jpostal[names[i]] = i_args[names[i]];
		}
	}
	
	var int_names = new Array(
		'KEN_ALL',
		'JIGYOSYO',
		'LIMIT',
		'MAXLEN',
		'MINLEN',
		'preformat'
		);
		
	for (var i = 0; i < int_names.length; ++i)
	{
		_jpostal[int_names[i]] = parseInt(_jpostal[int_names[i]]);
	}
}


function _JPOSTAL_check_postcode()
{
	// 全角数字を半角数字に変換する
	_jpostal.POSTCODE = JPOSTAL_z2h(_jpostal.POSTCODE);

	// 半角数字と'-'以外があるか
	if ( 0 <= _jpostal.POSTCODE.search(/[^0-9\-]/) )
	{
		// 郵便番号に数字以外の文字があります
		_jpostal.error = 2;
		return;
	}

	// 半角数字以外は、削除する
	_jpostal.POSTCODE = _jpostal.POSTCODE.replace(/[^0-9]/g, '');
	
	if (_jpostal.POSTCODE.length < _jpostal.MINLEN)
	{
		// 郵便番号が３桁未満です
		_jpostal.error = 3;
		return;
	}

	if (_jpostal.MAXLEN < _jpostal.POSTCODE.length)
	{
		// 郵便番号が７桁を超えています
		_jpostal.error = 4;
		return;
	}
}

function _JPOSTAL_select(i_buf_arr)
{
	var category;
	var re;
	var addr_value_arr;
	var arr_len;

	category = 0;
	if (_jpostal.KEN_ALL ) { category |= 1; }
	if (_jpostal.JIGYOSYO) { category |= 2; }
	
	re = new RegExp("^" + _jpostal.POSTCODE);
	addr_value_arr = new Array();
	arr_len = 0;

	for (var i = 0; i < i_buf_arr.length; i++)
	{
		var buf = i_buf_arr[i];
		
		if ( 0 <= buf.search(re)  && (_JPOSTAL_category(buf) & category) )
		{
			addr_value_arr[arr_len] = buf;
			arr_len++;
		}
	}
	
	return addr_value_arr;
}


function _JPOSTAL_preformat(io_addr_value_arr)
{
	var left_str, right_str;
	
	for (var i = 0; i < io_addr_value_arr.length; ++i)
	{
		left_str  = io_addr_value_arr[i].substr(0, 3);
		right_str = io_addr_value_arr[i].substr(3);
		io_addr_value_arr[i] = left_str + ',' + right_str;
	}
}

function _JPOSTAL_category(i_addr_value)
{
	var field_arr;
	var category;

	field_arr = i_addr_value.split(',');
	category = (field_arr[4] == '' && field_arr[5] == '') ? 1 : 2;

	return category;
}

function _JPOSTAL_load()
{
	var buf_arr;

	/*----------------------------------------
		データソース
		datajs/000.js 
	 *----------------------------------------*/
	if (typeof(JPOSTAL_datajs) == 'function')
	{
		_jpostal.is_selected = false;
		buf_arr = JPOSTAL_datajs();
		return buf_arr;
	}

	/*----------------------------------------
		データソース
		サーバー側であらかじめ検索処理済み
		datajs.cgi     + datacsv/*.csv
		datajs.php     + datacsv/*.php
		datajs_js.asp  + datacsv/*.csv
		datajs_vbs.asp + datacsv/*.csv
	 *----------------------------------------*/
	if (typeof(JPOSTAL_datajs_selected) == 'function')
	{
		_jpostal.is_selected = true;
		buf_arr = JPOSTAL_datajs_selected();
		return buf_arr;
	}
	
	// 郵便データファイルが見つかりません
	_jpostal.error = 5;

	buf_arr = new Array();
	return buf_arr;
}


//EOF
