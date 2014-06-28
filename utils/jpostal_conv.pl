#!/usr/bin/perl
#############################################################
# jpostal.conv
#
# Copyright (c) 2003 Aoki Makoto <gzl03577@nifty.com>
# MW web studio http://homepage2.nifty.com/mwweb/
#
# Usage:
#   jpostal_conv.pl CONFIG_FILE
#############################################################
use POSIX qw(strftime);

#============================================================
# constants
#============================================================
$KA_DELIMITER_C = ',';

$KA_JICHITAI_E = 0;	#óÒA
$KA_OLDCODE_E  = 1;
$KA_POSTCODE_E = 2;
$KA_KANA1_E    = 3;
$KA_KANA2_E    = 4;
$KA_KANA3_E    = 5;
$KA_ADDR1_E    = 6;
$KA_ADDR2_E    = 7;
$KA_ADDR3_E    = 8;
$KA_OPT1_E     = 9;
$KA_OPT2_E     = 10;
$KA_OPT3_E     = 11;
$KA_OPT4_E     = 12;
$KA_OPT5_E     = 13;
$KA_OPT6_E     = 14;

$JI_DELIMITER_C = ',';

$JI_JICHITAI_E   = 0;	#óÒA
$JI_KANA5_E      = 1;
$JI_ADDR5_E      = 2;
$JI_ADDR1_E      = 3;
$JI_ADDR2_E      = 4;
$JI_ADDR3_E      = 5;
$JI_ADDR4_E      = 6;
$JI_POSTCODE_E   = 7;
$JI_OLDCODE_E    = 8;
$JI_POSTOFFICE_E = 9;
$JI_OPT1_E       = 10;
$JI_OPT2_E       = 11;
$JI_OPT3_E       = 12;

$IN_DELIMITER_C  = ',';

$IN_POSTCODE_E = 0;
$IN_KANA1_E    = 1;
$IN_KANA2_E    = 2;
$IN_KANA3_E    = 3;
$IN_KANA4_E    = 4;
$IN_KANA5_E    = 5;
$IN_ADDR1_E    = 6;
$IN_ADDR2_E    = 7;
$IN_ADDR3_E    = 8;
$IN_ADDR4_E    = 9;
$IN_ADDR5_E    = 10;
$IN_JICHITAI_E = 11;

$OUTPUT_DELIMITER_C = ',';
$OUTPUT_CSV_DIR_C = 'datacsv';
$OUTPUT_JS_DIR_C  = 'datajs';
$OUTPUT_JS_FUNC_C = "JPOSTAL_datajs";

$IS_WINDOWS_C = ($ENV{'TEMP'} =~ /\\/);
$TEMP_DIR_C   = $ENV{'TEMP'};

#============================================================
# default config
#============================================================
$KEN_ALL_CSV  = 'ken_all.csv';
$JIGYOSYO_CSV = 'jigyosyo.csv';
$OUTPUT_DIR   = '.';

$LINE_LIMIT   = 200000;

$OUTPUT_KEN_ALL  = 1;
$OUTPUT_JIGYOSYO = 1;

@OUPUT_FIELD = (
	1,	# [0] POSTCODE_E
	0,	# [1] KANA1_E
	0,	# [2]
	0,	# [3]
	0,	# [4]
	0,	# [5]
	1,	# [6] ADDR1_E
	1,	# [7]
	1,	# [8]
	1,	# [9]
	1,	# [10]
	0	# [11] JICHITAI_E
	);

$OUTPUT_JS = 1;


#============================================================
# user config
#============================================================
if ($ARGV[0] eq '')
{
	print <<END_OF_USAGE;
Usage: perl jpostal_conv.pl CONFIG_FILE
hist any key.
END_OF_USAGE
	
	<STDIN>;
	exit;
}
require($ARGV[0]);


#============================================================
# global vars, but not config
#============================================================
$DST_DATE;
$SRC_DATE;


#============================================================
# main
#============================================================
&main;

sub main
{
	local($t0, $t1, $process_time);

	print <<END_OF_OPENING;	
==================================================
J-POSTAL CONVERTER
copyright (C) 2003 MW Web Studio
==================================================
END_OF_OPENING

	print "TEMP_DIR=$TEMP_DIR_C\n";
	
	$t0 = time;

	local($ken_all_tmp    ) = $TEMP_DIR_C . "/" . "ken_all.tmp";
	local($jigyosyo_tmp   ) = $TEMP_DIR_C . "/" . "jigyosyo.tmp";
	local($jpostal_tmp    ) = $TEMP_DIR_C . "/" . "jpostal.tmp";
	local($jpostal_csv    ) = $TEMP_DIR_C . "/" . "jpostal.csv";
	local($output_csv_dir ) = $OUTPUT_DIR . "/" . $OUTPUT_CSV_DIR_C;
	local($output_js_dir  ) = $OUTPUT_DIR . "/" . $OUTPUT_JS_DIR_C;

	&process;
	&result;
	
	$t1 = time;
	
	$process_time = $t1 - $t0;

	print <<END_OF_CLOSING;
------------------------------
Complete.
process time = $process_time (sec)
hit any key.
END_OF_CLOSING
	<STDIN>;
}

sub process
{
	$SRC_DATE = strftime('%Y/%m/%d %H:%M:%S', localtime((stat($KEN_ALL_CSV))[9]) ); #mtime
	$DST_DATE = strftime('%Y/%m/%d %H:%M:%S', localtime);
	
	unlink($ken_all_tmp );
	unlink($jigyosyo_tmp);
	unlink($jpostal_tmp );
	unlink($jpostal_csv );
	
	print "process KEN_ALL.CSV\n";
	print "$KEN_ALL_CSV\n";
	&process_ken_all ($KEN_ALL_CSV,  $ken_all_tmp );
	
	print "process JIGYOSYO.CSV\n";
	print "$JIGYOSYO_CSV\n";
	&process_jigyosyo($JIGYOSYO_CSV, $jigyosyo_tmp);
	
	print "concat\n";
	&concat_file($ken_all_tmp, $jigyosyo_tmp, $jpostal_tmp);

	print "sort\n";
	&sort_file($jpostal_tmp, $jpostal_csv);
	&count_lines($jpostal_csv);

	print "output csv\n";
	print "$output_csv_dir\n";
	&output_csv($jpostal_csv, $output_csv_dir);

	print "output js\n";
	print "$output_js_dir\n";
	&output_js($output_csv_dir, $output_js_dir);

	&output_version_txt("$output_js_dir/version.txt");
}

sub error
{
	local($i_type, $i_num, $i_description, $i_option) = @_;
	local($str);
	
	$str = "$i_type: $i_num : $i_description : $i_option\n";
	
	if ($i_type eq 'ERROR')
	{
		print $str;
		
		print "\n";
		print "hit any key.";
		<STDIN>;
		exit;
	}
	else
	{
		print $str;
	}
}

sub process_ken_all
{
	local($i_src_fname, $i_dst_fname) = @_;
	local($read_count);
	local($src_field_arr);
	local($dst_field_arr);
	local($dst_buf);
	local($lines);
	local($n);
	
	open(FSRC,   $i_src_fname ) || &error('ERROR', 11, $!, $i_src_fname);
	open(FDST, ">$i_dst_fname") || &error('ERROR', 12, $!, $i_dst_fname);

	for ($lines = 0; $lines < $LINE_LIMIT; ++$lines)
	{
		@src_field_arr = &read_ken_all(\*FSRC);
		
		if (! scalar(@src_field_arr)) { last; }

		@dst_field_arr = @src_field_arr;
		&process_addr3(\@dst_field_arr);

		@dst_field_arr = (
			$dst_field_arr[$KA_POSTCODE_E],
			$dst_field_arr[$KA_KANA1_E   ],
			$dst_field_arr[$KA_KANA2_E   ],
			$dst_field_arr[$KA_KANA3_E   ],
			'',
			'',
			$dst_field_arr[$KA_ADDR1_E   ],
			$dst_field_arr[$KA_ADDR2_E   ],
			$dst_field_arr[$KA_ADDR3_E   ],
			'',
			'',
			$dst_field_arr[$KA_JICHITAI_E  ]
			);
			
		$dst_buf = join($KA_DELIMITER_C, @dst_field_arr);
		print FDST $dst_buf . "\n";
	}
	
	close(FDST);
	close(FSRC);
}


sub read_ken_all
{
	local($FH) = @_;
	local($buf);
	local(@field_arr) = ();
	local($physical_lines) = 0;
	
	$buf = <$FH>;
	if ($buf eq '')
	{
		return;
	}
	
	++ $physical_lines;
	@field_arr = &parse_csv($buf, $KA_DELIMITER_C);

	if ( index($field_arr[$KA_ADDR3_E], 'Åi') < 0 )
	{
		# 'Åi' Ç™Ç»Ç¢ÅAÇ¬Ç‹ÇËåpë±çsÇÕÇ»Ç¢
	}
	elsif ( 0 <= index($field_arr[$KA_ADDR3_E], 'Åj'))
	{
		# 'Åi' Ç∆ 'Åj'Ç™Ç†ÇÈÅAÇ¬Ç‹ÇËåpë±çsÇÕÇ»Ç¢
	}
	else
	{
		local($postcode) = $field_arr[$KA_POSTCODE_E];
		local($field_arr_of_next_line);
		local($read_pos);

		# åpë±çsÇì«Ç›çûÇﬁ
		while (1)
		{
			$read_pos = tell($FH);
			
			if ( ! ($buf = <$FH>) )
			{
				last;
			}
			@field_arr_of_next_line = &parse_csv($buf, $KA_DELIMITER_C);

			# óXï÷î‘çÜÇ™à·Ç¶ÇŒÅAåpë±çsÇ≈ÇÕÇ»Ç¢
			# ÉtÉ@ÉCÉãÉ|ÉWÉVÉáÉìÇì«Ç›çûÇ›ëOÇÃèÛë‘Ç…ñﬂÇ∑ÅB
			if ($field_arr_of_next_line[$KA_POSTCODE_E] ne $postcode)
			{
				seek($FH, $read_pos, 0);
				last;
			}
			++ $physical_lines;
			
			# í¨àÊÇåãçáÇ∑ÇÈ(ÉJÉiÇÕåãçáÇµÇ»Ç¢)
			$field_arr[$KA_ADDR3_E] = $field_arr[$KA_ADDR3_E] . $field_arr_of_next_line[$KA_ADDR3_E];

			# 'Åj'Ç™Ç†ÇÍÇŒÅAåpë±çsÇÃèIÇÌÇË
			if ( 0 <= index($field_arr_of_next_line[$KA_ADDR3_E], 'Åj') )
			{
				last;
			}
		}
	}
	
	return @field_arr;
}

sub process_addr3
{
	local(*io_field_arr) = @_;
	local($n);
	
	# s/à»â∫Ç…åfç⁄Ç™Ç»Ç¢èÍçá//g
	# s/≤∂∆π≤ª≤∂ﬁ≈≤ ﬁ±≤//g;
	if ( 0 <= index($io_field_arr[$KA_ADDR3_E], 'à»â∫Ç…åfç⁄Ç™Ç»Ç¢èÍçá') )
	{
		$io_field_arr[$KA_ADDR3_E] = '';
		$io_field_arr[$KA_KANA3_E] = '';
		return;
	}
	
	# s/.*ÇÃéüÇ…î‘ínÇ™Ç≠ÇÈèÍçá//g
	# s/.*…¬∑ﬁ∆ ﬁ›¡∂ﬁ∏Ÿ ﬁ±≤//g;
	if ( 0 <= index($io_field_arr[$KA_ADDR3_E], 'ÇÃéüÇ…î‘ínÇ™Ç≠ÇÈèÍçá') )
	{
		$io_field_arr[$KA_ADDR3_E] = '';
		$io_field_arr[$KA_KANA3_E] = '';
		return;
	}
	
	# "xxxÇ`ÇaÇbí¨","Ç`ÇaÇbí¨àÍâ~" ÇÕâ¡çHÇ∑ÇÈ
	# "xxxÇ`ÇaÇbí¨","ÇwÇxÇyí¨àÍâ~" ÇÕâ¡çHÇµÇ»Ç¢
	# "xxxÇ`ÇaÇbí¨", "àÍâ~"        ÇÕâ¡çHÇµÇ»Ç¢
	
	$n = index($io_field_arr[$KA_ADDR3_E], 'àÍâ~');
	if ( $n == 0 )
	{
		# "xxxÇ`ÇaÇbí¨", "àÍâ~"        ÇÕâ¡çHÇµÇ»Ç¢
	}
	elsif ( 0 < $n )
	{
		local($addr3_head);
		local($addr2_tail);
		$addr3_head = &str_left ($io_field_arr[$KA_ADDR3_E], $n);
		$addr2_tail = &str_right($io_field_arr[$KA_ADDR2_E], $n); 

		if ($addr3_head eq $addr2_tail)
		{
			# "xxxÇ`ÇaÇbí¨","Ç`ÇaÇbí¨àÍâ~" ÇÕâ¡çHÇ∑ÇÈ
			$io_field_arr[$KA_ADDR3_E] = '';
			$io_field_arr[$KA_KANA3_E] = '';
			return;
		}
		else
		{
			# "xxxÇ`ÇaÇbí¨","ÇwÇxÇyí¨àÍâ~" ÇÕâ¡çHÇµÇ»Ç¢
		}
	}

	# s/Åi.*//g
	$n = index($io_field_arr[$KA_ADDR3_E], 'Åi');
	if (0 <= $n )
	{
		$io_field_arr[$KA_ADDR3_E] = substr($io_field_arr[$KA_ADDR3_E], 0, $n);
		$io_field_arr[$KA_KANA3_E] =~ s/\(.*//g;
		return;
	}
	
	return 0;

}

sub process_jigyosyo
{
	local($i_src_fname, $i_dst_fname) = @_;
	
	local($src_buf);
	local($dst_buf);
	local(@src_field_arr);
	local(@dst_field_arr);
	local($lines);
	
	open(FSRC,   $i_src_fname ) || &error('ERROR', 21, $!, $i_src_fname);
	open(FDST, ">$i_dst_fname") || &error('ERROR', 22, $!, $i_dst_fname);
	
	for ($lines = 0; $lines < $LINE_LIMIT && ($src_buf = <FSRC>); ++$lines)
	{
		chomp($src_buf);
		@src_field_arr = &parse_csv($src_buf, $JI_DELIMITER_C);
		
		@dst_field_arr = (
			$src_field_arr[$JI_POSTCODE_E],
			'',
			'',
			'',
			'',
			$src_field_arr[$JI_KANA5_E],
			$src_field_arr[$JI_ADDR1_E],
			$src_field_arr[$JI_ADDR2_E],
			$src_field_arr[$JI_ADDR3_E],
			$src_field_arr[$JI_ADDR4_E],
			$src_field_arr[$JI_ADDR5_E],
			$src_field_arr[$JI_JICHITAI_E]
			);
		$dst_buf = join($JI_DELIMITER_C, @dst_field_arr);
		
		print FDST $dst_buf . "\n";
	}
	
	close(FDST);
	close(FSRC);
}

sub output_csv
{
	local($i_src_fname, $i_output_dir) = @_;
	local($postcode);
	local($last_postcode);
	local($src_buf);
	local(@src_arr);
	local($dst_buf);
	local(@dst_arr);
	local($i);
	
	mkdir($i_output_dir, 0755);
	$n = unlink(<'$i_output_dir/*'>);

	open(FSRC, $i_src_fname   ) || &error('WARNING', 32, $!, $i_src_fname);
	
	$last_postcode = '';
	while ($src_buf = <FSRC>)
	{
		chomp($src_buf);
		@src_arr = split($IN_DELIMITER_C, $src_buf);
		$postcode = substr($src_arr[0], 0, 3);
		
		if ($postcode eq '')
		{
		}
		elsif ($last_postcode ne $postcode)
		{
			close(FDST);
			
			$dst_fname = "$i_output_dir/$postcode.csv";
			$last_postcode = $postcode;
			
			open(FDST, ">$dst_fname") || &error('ERROR', 33, $!, $dst_fname);

			# output comment
			print FDST &csv_comment("VERSION: $VERSION"    ) . "\n";
			print FDST &csv_comment("USER_NAME: $USER_NAME") . "\n";
#			print FDST &csv_comment("SRC_DATE: $SRC_DATE"  ) . "\n";
#			print FDST &csv_comment("DST_DATE: $DST_DATE"  ) . "\n";
		}
		
		if ( &is_jigyosyo(\@src_arr) )
		{
			if ( ! $OUTPUT_JIGYOSYO ) { next; }
		}
		else
		{
			if ( ! $OUTPUT_KEN_ALL  ) { next; }
		}
		
		@dst_arr = ();
		for ($i = 0; $i < @OUPUT_FIELD; ++$i)
		{
			$dst_arr[$i] = $OUPUT_FIELD[$i] ? $src_arr[$i] : '';
		}

		@dst_arr = (
			$dst_arr[$IN_POSTCODE_E],
			$dst_arr[$IN_ADDR1_E],
			$dst_arr[$IN_ADDR2_E],
			$dst_arr[$IN_ADDR3_E],
			$dst_arr[$IN_ADDR4_E],
			$dst_arr[$IN_ADDR5_E],
			$dst_arr[$IN_KANA1_E],
			$dst_arr[$IN_KANA2_E],
			$dst_arr[$IN_KANA3_E],
			$dst_arr[$IN_KANA4_E],
			$dst_arr[$IN_KANA5_E],
			$dst_arr[$IN_JICHITAI_E]
			);
		
		$dst_buf = join($OUTPUT_DELIMITER_C, @dst_arr);
		print FDST $dst_buf . "\n";
	}
	
	close(FDST);
	close(FSRC);
}

sub is_jigyosyo
{
	local(*i_arr) = @_;
	
	return $i_arr[$IN_ADDR4_E] ne '' || $i_arr[$IN_ADDR5_E] ne '';
}


sub output_js
{
	local($i_csv_dir, $i_dst_dir) = @_;
	local($i);
	
	mkdir($i_dst_dir, 0755);
	unlink(<'$i_dst_dir/*'>);
	
	$lines = 0;
	for ($i = 0; $i < 1000; ++$i)
	{
		$csv_fname = sprintf("%s/%03d.csv", $i_csv_dir, $i);
		$dst_fname = sprintf("%s/%03d.js",  $i_dst_dir, $i);
		
		# åáä◊î‘çÜ:3 ëŒçÙ2
		# ë∂ç›ÇµÇ»Ç¢ÇRåÖî‘çÜÇ≈Ç‡ÅAãÛÉfÅ[É^ÇÃÉtÉ@ÉCÉãÇópà”Ç∑ÇÈ
		# csvÉtÉ@ÉCÉãÇÃë∂ç›É`ÉFÉbÉNÇÕçÌèúÇµÇΩ
		#     if ( -f $csv_fname )
		&convert_js($csv_fname, $dst_fname);
	}
}

sub convert_js
{
	local($i_src_fname, $i_dst_fname) = @_;
	local($lines);
	local($src_buf);
	local($dst_buf);
	
	open(FSRC,   $i_src_fname ) || &error('WARNING', 41, $!, $i_src_fname);
	open(FDST, ">$i_dst_fname") || &error('ERROR',   42, $!, $i_dst_fname);;
	
	print FDST <<END_OF_HEADER;
function $OUTPUT_JS_FUNC_C(){
var a = new Array();
END_OF_HEADER

	for ($lines = 0; $src_buf = <FSRC>; )
	{
		chomp($src_buf);
		if ( &is_csv_comment($src_buf) )
		{
			$dst_buf = &csv_uncomment($src_buf);
			$dst_buf = &js_comment($dst_buf);
		}
		else
		{
			$dst_buf = sprintf("a[%d]='%s';", $lines, $src_buf);
			++$lines;
		}
		print FDST $dst_buf . "\n";
	}
	
	print FDST <<END_OF_FOOTER;
return a; }
END_OF_FOOTER

	close FDST;
	close FSRC;
}

sub output_version_txt
{
	local($i_path) = @_;
	
	open(FDST, ">$i_path") || &error('ERROR',   43, $!, $i_dst_fname);
	print FDST "VERSION: $VERSION"    . "\n";
	print FDST "USER_NAME: $USER_NAME". "\n";
	print FDST "SRC_DATE: $SRC_DATE"  . "\n";
	print FDST "DST_DATE: $DST_DATE"  . "\n";
	close FDST
}


sub concat_file
{
	local(@i_fname_arr) = @_;
	local(@src_fname_arr);
	local($dst_fname);
	local($cmd_line);
	
	$dst_fname = pop(@i_fname_arr);
	
	@src_fname_arr = map { '"' . $_ . '"' } @i_fname_arr;
	
	if ( $IS_WINDOWS_C )
	{
		$cmd_line = sprintf('copy %s %s', join('+', @src_fname_arr), $dst_fname);
		$cmd_line =~ s/\//\\/g;
	}
	else
	{
		$cmd_line = sprintf('cat %s >%s', join(' ', @src_fname_arr), $dst_fname);
	}
	
	print "$cmd_line\n";
	system($cmd_line);
}

sub sort_file
{
	local($i_src_fname, $i_dst_fname) = @_;
	local($cmd_line);
	
	$cmd_line = sprintf('sort "%s" >"%s"', $i_src_fname, $i_dst_fname);

	if ( $IS_WINDOWS_C )
	{
		$cmd_line =~ s/\//\\/g;
	}
	print "$cmd_line\n";
	system($cmd_line);
}

sub parse_csv
{
	local($i_buf, $i_delimiter) = @_;
	local(@field_arr);
	
	@field_arr = split($i_delimiter, $i_buf);
	@field_arr = map { &strip_quote($_) } @field_arr;
	
	return @field_arr;
}

sub strip_quote
{
	local($i_buf) = @_;
	local($buf) = $i_buf;
	
	$buf =~ s/^\"//;
	$buf =~ s/\"$//;
	
	return $buf;
}

sub csv_comment
{
	local($i_buf) = @_;
	
	return "#" . $i_buf;
}

sub csv_uncomment
{
	local($i_buf) = @_;
	
	return substr($i_buf, 1);
}

sub is_csv_comment
{
	local($i_buf) = @_;
	
	return substr($i_buf, 0, 1) eq '#';
}

sub js_comment
{
	local($i_buf) = @_;
	
	return "//" . $i_buf;
}

sub count_lines
{
	local($i_fname) = @_;
	local($lines);
	
	open(FSRC, $i_fname);
		
	for ($lines = 0; <FSRC>; ++$lines)
	{
	}
		
	close FSRC;
	
	return $lines;
}

sub count_lines_ken_all_csv
{
	local($i_fname) = @_;
	local($lines);
	local($line_type);

	open(FSRC, $i_fname);
	
	$line_type = 0;
	for ($lines = 0; <FSRC>; )
	{
		if ( $line_type == 0 )
		{
			$lines ++;
			
			if ( 0 <= index($_,'Åi') &&  index($_,'Åj') < 0 )
			{
				$line_type = 1;
			}
			else
			{
				;
			}
		}
		else
		{
			if ( 0 <= index($_,'Åj') )
			{
				$line_type = 0;
			}
			else
			{
				;
			}
		}
	}
		
	close FSRC;
	
	return $lines;
}

sub count_lines_csv
{
	local($i_fname) = @_;
	local($lines);
	
	open(FSRC, $i_fname);
		
	for ($lines = 0; <FSRC>; )
	{
		if ( ! /^#/ )
		{
			++$lines;
		}
	}
		
	close FSRC;
	
	return $lines;
}

sub count_lines_js
{
	local($i_fname) = @_;
	local($lines);
	
	open(FSRC, $i_fname);
		
	for ($lines = 0; <FSRC>; )
	{
		if ( /^a\[/ )
		{
			++$lines;
		}
	}
		
	close FSRC;
	
	return $lines;
}

sub str_left
{
	local($i_str, $i_len) = @_;
	
	return substr($i_str, 0, $i_len);
}

sub str_right
{
	local($i_str, $i_len) = @_;
	
	return substr($i_str, length($i_str) - $i_len);
}


sub result
{
	local($title, $n, $unit);
	local(@arr);

format = 
@<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< @>>>>>> @<<<<<<<<
$title, $n, $unit
.	

	print "RESULT\n";
	
	$title = 'KEN_ALL.CSV';
	$n     = &count_lines($KEN_ALL_CSV);
	$unit  = 'lines';
	write;

	$title = 'KEN_ALL.CSV(logical)';
	$n     = &count_lines_ken_all_csv($KEN_ALL_CSV);
	$unit  = 'lines';
	write;

	$title = 'ken_all.tmp';
	$n     = $a = &count_lines($ken_all_tmp);
	$unit  = 'lines';
	write;

	$title = 'JIGYOSYO.CSV';
	$n     = &count_lines($JIGYOSYO_CSV);
	$unit  = 'lines';
	write;

	$title = 'jigyosyo.tmp';
	$n     = $b = &count_lines($jigyosyo_tmp);
	$unit  = 'lines';
	write;

	$title = 'ken_all.tmp + jigyosyo.tmp';
	$n     = $a + $b;
	$unit  = 'lines';
	write;

	$title = 'jpostal.tmp';
	$n     = &count_lines($jpostal_tmp);
	$unit  = 'lines';
	write;

	$title = 'jpostal.csv';
	$n     = &count_lines($jpostal_csv);
	$unit  = 'lines';
	write;

	$title = "datacsv/*.csv";
	@arr   = <'$output_csv_dir'/*.csv>;
	$n     = scalar(@arr);
	$unit  = 'files';
	write;

	$n = 0;
	map { $n += count_lines_csv($_) } @arr;
	$unit  = 'lines';
	write;

	$title = "datajs/*.js";
	@arr   = <'$output_js_dir'/*.js>;
	$n     = scalar(@arr);
	$unit  = 'files';
	write;

	$n = 0;
	map { $n += count_lines_js($_) } @arr;
	$unit  = 'lines';
	write;
}

