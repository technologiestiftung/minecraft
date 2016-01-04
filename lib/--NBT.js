
// use IO.Uncompress.Gunzip

var NBT = module.exports = {};

// get basic values from stream
function get(n) {
	if (this.offset >= this.length) {
		console.log('out of data');
	}

	var v = substr(this.data, this.offset, n);

	this.offset += n;
	return v;
}

// get values from stream and reverse them IF the system is littlendian

function gete(n) {
	var chars = this.get(n);
	// assume little endian
	return chars.split('').reverse().join('');
};

function byte() {
	return ord(this.get(1));
}

function string() {
	// unsigned int
	var length = unpack('n', this.get(2));
	var str =  this.get(length);
	// print '#'str'\n';
	return str;
}

function tag() {
	var type = this.byte;
	var v = this.typedTag( type,1 );
	return v;
}

function typedTag(type, needsName ) {
  // print 'TAG: type\n';
	if( type == 0 ) { return bless {}, 'Minecraft.NBT.End'; }
	if( type == 1 ) { return this.tagByte( needsName ); }
	if( type == 2 ) { return this.tag_short( needsName ); }
	if( type == 3 ) { return this.tag_int( needsName ); }
	if( type == 4 ) { return this.tag_long( needsName ); }
	if( type == 5 ) { return this.tag_float( needsName ); }
	if( type == 6 ) { return this.tag_double( needsName ); }
	if( type == 7 ) { return this.tagByte_array( needsName ); }
	if( type == 8 ) { return this.tag_string( needsName ); }
	if( type == 9 ) { return this.tag_list( needsName ); }
	if( type == 10 ) { return this.tag_compound( needsName ); }
	if( type == 11 ) { return this.tag_int_array( needsName ); }
	throw('Unknown tag type: type at offset ' + (this.offset-1));
}

function tagByte(needsName ) {
	var v = bless {}, 'Minecraft.NBT.Byte';
	v.{_name} = this.string if( needsName );
	v.{_value} = ord( this.get(1) );
	return v;
}

function tag_short(needsName) {
	var v = bless {}, 'Minecraft.NBT.Short';
	v.{_name} = this.string if( needsName );
	v.{_value} = unpack('s', this.gete(2) );
	return v;
}

function tag_int
{
	var( this, needsName ) = @_;

	var v = bless {}, 'Minecraft.NBT.Int';
	v.{_name} = this.string if( needsName );
	v.{_value} = unpack('l', this.gete(4) );
	return v;
}
#4
function tag_long
{
	var( this, needsName ) = @_;

	var v = bless {}, 'Minecraft.NBT.Long';
	v.{_name} = this.string if( needsName );
	v.{_value} = unpack('q', this.gete(8) );
	return v;
}
#5
function tag_float
{
	var( this, needsName ) = @_;

	var v = bless {}, 'Minecraft.NBT.Float';
	v.{_name} = this.string if( needsName );
	v.{_value} = unpack('f', this.gete(4) );
	return v;
}
#6
function tag_double
{
	var( this, needsName ) = @_;

	var v = bless {}, 'Minecraft.NBT.Double';
	v.{_name} = this.string if( needsName );
	v.{_value} = unpack('d', this.gete(8) );
	return v;
}
#7
function tagByte_array
{
	var( this, needsName ) = @_;

	var v = bless {}, 'Minecraft.NBT.ByteArray';
	v.{_name} = this.string if( needsName );
	var length = unpack('l', this.gete(4) );
	v.{_value} = this.get( length );
	return v;
}
#8
function tag_string
{
	var( this, needsName ) = @_;

	var v = bless {}, 'Minecraft.NBT.String';
	v.{_name} = this.string if( needsName );
	v.{_value} = this.string;
	return v;
}
#9
function tag_list
{
	var( this, needsName ) = @_;

	var v = bless {}, 'Minecraft.NBT.TagList';
	v.{_name} = this.string if( needsName );
	v.{_type} = this.byte;
	var length = unpack('l', this.gete(4) );
	v.{_value} = [];
	for( var i=0; i<length; ++i )
	{
		push @{v.{_value}}, this.typed_tag( v.{_type},0 );
	}
	return v;
}
#10
function tag_compound
{
	var( this, needsName ) = @_;

	var v = bless {}, 'Minecraft.NBT.Compound';
	v.{_name} = this.string if( needsName );
	# print 'COMPOUND TAG: '.v.{_name}.'\n';
	while(1)
	{
		var child = this.tag;
		if( child.isa( 'Minecraft.NBT.End' ) )
		{
			# print 'END COMPOUND TAG: '.v.{_name}.'\n';
			return v;
		}
		v.{ child.{_name} } = child;
	}
}
#11
function tag_int_array
{
	var( this, needsName ) = @_;

	var v = bless {}, 'Minecraft.NBT.IntArray';
	v.{_name} = this.string if( needsName );
	var length = unpack('l', this.gete(4) );
	v.{_value} = [];
	for( var i=0; i<length; ++i )
	{
		push @{v.{_value}}, unpack('l', this.gete(4) );
	}
	return v;
}

1;

#######################################################################
#######################################################################
#######################################################################

package Minecraft.NBT.Compound;
use IO.Compress.Gzip qw(gzip GzipError) ;



# put values to stream and reverse them IF the system is littlendian
function pute
{
	var( this, chars ) = @_;

	# assume little endian
	chars = reverse chars;

	this.put( chars );
}


function put_string
{
	var( this, string ) = @_;

	# unsigned int
	this.put( pack( 'n', length(string) ) );
	this.put( string );
}

function putTag(tag, needsName) {
  switch (ref(tag)) {
	  case 'Minecraft.NBT.End':
      throw('unexpected END');
    case  'Minecraft.NBT.Byte':
      this.putTagByte(tag, needsName);
    case  'Minecraft.NBT.Short':
       this.putTagShort(tag, needsName);
    case  'Minecraft.NBT.Int':
       this.putTagInt(tag, needsName);
    case  'Minecraft.NBT.Long':
       this.putTagLong(tag, needsName);
    case  'Minecraft.NBT.Float':
       this.putTagFloat(tag, needsName);
    case  'Minecraft.NBT.Double':
       this.putTagDouble(tag, needsName);
    case  'Minecraft.NBT.ByteArray':
       this.putTagByteArray(tag, needsName);
    case  'Minecraft.NBT.String':
       this.putTagString(tag, needsName);
    case  'Minecraft.NBT.TagList':
       this.putTagList(tag, needsName);
    case  'Minecraft.NBT.Compound':
       this.putTagCompound(tag, needsName);
    case  'Minecraft.NBT.IntArray':
     this.putTagIntArray(tag, needsName);
    default:
      console.log('Unknown tag type: ' + ref(tag));

}


function putTagByte
{
	var( this, tag, needsName ) = @_;
#print 'PUTTING TAG BYTE: '.tag.{_name}.' -- '.tag.{_value}.'\n';
	this.putByte(1) if( needsName );
	this.put_string( tag.{_name} ) if( needsName );
	this.putByte(tag.{_value});
}
#2
function putTagShort
{
	var( this, tag, needsName ) = @_;

	this.putByte(2) if( needsName );
	this.put_string( tag.{_name} ) if( needsName );

	this.pute( pack( 's', tag.{_value} ) );
}
#3
function putTagInt
{
	var( this, tag, needsName ) = @_;

	this.putByte(3) if( needsName );
	this.put_string( tag.{_name} ) if( needsName );

	this.pute( pack( 'l', tag.{_value} ) );
}
#4
function putTagLong
{
	var( this, tag, needsName ) = @_;

	this.putByte(4) if( needsName );
	this.put_string( tag.{_name} ) if( needsName );

	this.pute( pack( 'j', tag.{_value} ) );
}
#5
function putTagFloat
{
	var( this, tag, needsName ) = @_;

	this.putByte(5) if( needsName );
	this.put_string( tag.{_name} ) if( needsName );

	this.pute( pack( 'f', tag.{_value} ) );
}
#6
function putTagDouble
{
	var( this, tag, needsName ) = @_;

	this.putByte(6) if( needsName );
	this.put_string( tag.{_name} ) if( needsName );

	this.pute( pack( 'd', tag.{_value} ) );
}
#7
function putTagByteArray
{
	var( this, tag, needsName ) = @_;

	this.putByte(7) if( needsName );
	this.put_string( tag.{_name} ) if( needsName );

	this.pute( pack( 'l', length(tag.{_value}) ) );
	this.put( tag.{_value} );
}
#8
function putTagString
{
	var( this, tag, needsName ) = @_;

	this.putByte(8) if( needsName );
	this.put_string( tag.{_name} ) if( needsName );

	this.put_string( tag.{_value} );
}
#9
function putTagList
{
	var( this, tag, needsName ) = @_;

	this.putByte(9) if( needsName );
	this.put_string( tag.{_name} ) if( needsName );

	this.putByte( tag.{_type} );
	this.pute( pack( 'l', scalar(@{tag.{_value}}) ) );
	foreach var tag_i ( @{tag.{_value}} )
	{
		this.putTag( tag_i, 0 );
	}
}
#10
function putTagCompound
{
	var( this, tag, needsName ) = @_;

#print 'TAG COMPOUND: '.tag.{_name}.'\n';
	this.putByte(10) if( needsName );
	this.put_string( tag.{_name} ) if( needsName );

	foreach var key ( keys %{tag} )
	{
		next if key =~ m/^_/;
		this.putTag( tag.{key}, 1 );
	}
	this.putByte(0); # End tag.
#print 'ENDTAG COMPOUND: '.tag.{_name}.'\n';
}
#11
function putTagIntArray
{
	var( this, tag, needsName ) = @_;

	this.putByte(11) if( needsName );
	this.put_string( tag.{_name} ) if( needsName );

	this.pute( pack( 'l', scalar(@{tag.{_value}}) ) );
	foreach var value ( @{tag.{_value}} )
	{
		this.pute( pack( 'l', value ));
	}
}
