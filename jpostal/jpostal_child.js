/*************************************************************
「郵便番号から住所検索」の子ウィンドウ側の処理

Copyright (c) 2003-2014 Aoki Makoto, Ninton G.K.
http://www.ninton.co.jp
************************************************************/
/*============================================================
 * public 変数
 *============================================================*/


/*============================================================
 * public 関数
 *============================================================*/
function JPOSTAL_CHILD_O()
{
	this.querystring = window.location.search;
	
	this.KEN_ALL    = 1;
	this.JIGYOSYO   = 0;
	this.LIMIT      = -1;
	this.POSTCODE   = '';
	this.MINLEN     = 3;
	this.MAXLEN     = 7;

	this.ID         = 0;
	this.FORMAT     = '%0-%1 %2 %3 %4';
	this.AUTO_RETURN_TYPE = 0;
	this.callback   = '';
	
	this.COUNT         = 0;
	this.ADDRESS_TEXT  = new Array();
	this.ADDRESS_VALUE = new Array();
	this.ERROR_MESSAGE = '';
	this.ERROR         = 0;
	
	this.VIEW_TYPE     = 0;

	this.WARNING_RAW_KANJI = 0;
	
	this.judge_raw_kanji = function (i_kanji)
	{
		var aiueo = 'あいうえお';
		this.WARNING_RAW_KANJI = (i_kanji == aiueo) ? 0 : 1;
	}
	
	this.get_arguments = function ()
	{
		var vars = MW_parse_string(this.querystring);
		
		var names = new Array(
			'ID',
			'KEN_ALL',
			'JIGYOSYO',
			'LIMIT',
			'FORMAT',
			'AUTO_RETURN_TYPE',
			'POSTCODE',
			'MINLEN',
			'MAXLEN',
			'callback'
			);
			
		for (var i = 0; i < names.length; i++)
		{
			if ( typeof(vars[names[i]]) != 'undefined')
			{
				this[names[i]] = vars[names[i]];
			}
		}

		var int_names = new Array(
			'ID',
			'KEN_ALL',
			'JIGYOSYO',
			'LIMIT',
			'AUTO_RETURN_TYPE',
			'MINLEN',
			'MAXLEN'
			);
			
		for (var i = 0; i < int_names.length; ++i)
		{
			this[int_names[i]] = parseInt(this[int_names[i]]);
		}

		this.POSTCODE = JPOSTAL_z2h(this.POSTCODE);
	}
	
	
	this.include = function ( i_url )
	{
		var vars, esc_vars, querystring;
		var url;
		var buf;
		var postcode;
		
		postcode = this.POSTCODE.replace(/[^0-9]/g, '')
		if ( postcode.length < this.MINLEN )
		{
			return '';
		}
		
		vars        = this.calculate_vars_for_select();
		esc_vars    = MW_escape_vars(vars);
		querystring = MW_calculate_querystring(esc_vars);

		url = i_url;
		url = url.replace(/%q/, querystring );
		url = url.replace(/%p/, this.POSTCODE.substr(0,3) );

		buf = MW_script_src(url);
		document.write(buf);
		
		return buf;
	}
	
	
	this.calculate_vars_for_select = function ()
	{
		var names = new Array(
			'POSTCODE',
			'KEN_ALL',
			'JIGYOSYO',
			'LIMIT',
			'MINLEN',
			'MAXLEN'
		);
	
		var vars = new Object();
		
		for (var i = 0; i < names.length; i++)
		{
			vars[ names[i] ]  = this[ names[i] ];
		}
		
		return vars;
	}
	
	
	this.main = function ()
	{
		this.find_address();
		this.calculate_view_type();
	}
	
	
	this.find_address = function ()
	{
		var vars = this.calculate_vars_for_select();

		this.ADDRESS_VALUE = JPOSTAL_select(vars);
		this.ERROR         = JPOSTAL_error();
		
		if (this.ERROR)
		{
			this.ERROR_MESSAGE = JPOSTAL_error_message(this.ERROR);
		}

		this.COUNT = this.ADDRESS_VALUE.length;

		for (var i = 0; i < this.ADDRESS_VALUE.length; ++i)
		{
			this.ADDRESS_TEXT[i] = JPOSTAL_format(this.FORMAT, this.ADDRESS_VALUE[i]);
		}
	}


	this.calculate_view_type = function ()
	{
		var view_type;
		
		switch ( parseInt(this.AUTO_RETURN_TYPE) )
		{
		case 0:
			if (this.ERROR)
			{
				view_type = 0;
			}
			else if (this.COUNT == 1)
			{
				view_type = 1;
			}
			else
			{
				view_type = 2;
			}
			break;
			
		case 1:
			if (this.ERROR)
			{
				view_type = 0;
			}
			else if (this.COUNT == 1)
			{
				view_type = 4;
			}
			else
			{
				view_type = 2;
			}
			break;
				
		case 2:
			if (this.ERROR)
			{
				view_type = 3;
			}
			else
			{
				view_type = 4;
			}
			break;
			
		default:
			// not reach here
			break;
		}
		
		this.VIEW_TYPE = view_type;
		return view_type;
	}

	this.return_value = function (i_index)
	{
		var value;

		if (typeof(i_index) == 'undefined')
		{
			i_index = 0;
		}
		
		if (i_index < 0 || this.ADDRESS_VALUE.length <= i_index)
		{
			return;
		}

		value = this.ADDRESS_VALUE[i_index];
		
		if (this.callback == '')
		{
			return;
		}
		
		var wnd = MW_find_window(this.callback);
		if (wnd)
		{
			wnd[this.callback](this.ID, value);
		}
	}
}


//EOF
