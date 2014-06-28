/*************************************************************
�u�X�֔ԍ�����Z�������v�̐e�E�B���h�E���̏���

Copyright (c) 2003-2014 Aoki Makoto, Ninton G.K.
http://www.ninton.co.jp

private �ϐ�

public �֐�
	new    JPOSTAL_PARENT_O()
	       
	void   JPOSTAL_parent_set_form()
*************************************************************/
/*============================================================
 * public �ϐ�
 *============================================================*/


/*============================================================
 * private 
 *============================================================*/
var _jpostal_parent_array = new Array();


/*============================================================
 * public �֐�
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

		/* ���הԍ�2
		 * window.open�ł�URL�󗓂ɂ��Awindow.location��URL�w�肷�邱��
		 * window.open��URL�w�肷��ƁAMac��NN4.7 �Ŗ�肪����
		 * �q�E�B���h�E�̃X�N���v�g�ŁAdocument.write('<SCRIPT src=xxx>')�����Ă��邽�߂��H
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


// �q�E�B���h�E����Ă΂��֐�
//
// �q�E�B���h�E�����s�N�_�Ȃ̂ŁA�q�E�B���h�E�Ɛe�E�B���h�E�̕����R�[�h���قȂ�ꍇ�A
// �u���E�U�ɂ���ẮA���������Ȃǂ̖�肪�����邩������Ȃ��B
// �e�E�B���h�E�̃t�H�[���ɒl���������Ƃ��A
// �u�q�E�B���h�E�̕����R�[�h�ŕ\������v�ƕ��������̉\������

function JPOSTAL_PARENT_output_result(i_id, i_address_value)
{
	var jpp_obj;
	
	jpp_obj = _jpostal_parent_array[i_id];
	jpp_obj.output_result(i_address_value);
}



//EOF
