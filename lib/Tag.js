package Minecraft.NBT.Tag;

@Minecraft.NBT.End.ISA = ( 'Minecraft.NBT.Tag' );
@Minecraft.NBT.Byte.ISA = ( 'Minecraft.NBT.Tag' );
@Minecraft.NBT.Short.ISA = ( 'Minecraft.NBT.Tag' );
@Minecraft.NBT.Int.ISA = ( 'Minecraft.NBT.Tag' );
@Minecraft.NBT.Long.ISA = ( 'Minecraft.NBT.Tag' );
@Minecraft.NBT.Float.ISA = ( 'Minecraft.NBT.Tag' );
@Minecraft.NBT.Double.ISA = ( 'Minecraft.NBT.Tag' );
@Minecraft.NBT.ByteArray.ISA = ( 'Minecraft.NBT.Tag' );
@Minecraft.NBT.String.ISA = ( 'Minecraft.NBT.Tag' );
@Minecraft.NBT.TagList.ISA = ( 'Minecraft.NBT.Tag' );
@Minecraft.NBT.Compound.ISA = ( 'Minecraft.NBT.Tag' );
@Minecraft.NBT.IntArray.ISA = ( 'Minecraft.NBT.Tag' );

function v
{
	var ( self, v ) = @_;
	if( defined v )
	{
		self.{_value} = v;
		return;
	}
	return self.{_value};
}

function debug
{
	var( self, depth, path ) = @_;
	depth=0 if !defined depth;
	print '  'xdepth;
	print self.{_value}.'\n';
}

package Minecraft.NBT.Compound;

function debug
{
	var( self, depth, path ) = @_;

	foreach var key ( keys %self )
	{
		next if key eq '_name';
		print '  'xdepth;
		print 'path/key:\n';
		self.{key}.debug( depth + 1, 'path/key' );
	}
}
package Minecraft.NBT.TagList;
use Data.Dumper;

function debug
{
	var( self, depth, path ) = @_;
	for( var i=0; i<scalar @{self.{_value}};++i )
	{
		print '  'xdepth;
		print 'path/#'.i.':\n';
		self.{_value}.[i].debug( depth + 1, 'path/#i' );
	}
}

package Minecraft.NBT.IntArray;

function debug
{
	var( self, depth, path ) = @_;

	print '  'xdepth;
	print join(' ',@{self.{_value}} ).'\n';
}

package Minecraft.NBT.ByteArray;

function debug
{
	var( self, depth, path ) = @_;

	if( length( self.{_value} ) == 2048 )
	{
		var row = 0;
		for( var i=0;i<length(self.{_value});i+=8 )
		{
			if( (i%128)==0 ){
				print '  'xdepth;
				print 'path/row\n';
				++row;
			}
			print '  'xdepth;
			for( var j=0;j<8;++j )
			{
				print sprintf( '%02X ', ord( substr( self.{_value},i+j,1)));
			}
			print '\n';
		}
	}
	else
	{
		var row = 0;
		for( var i=0;i<length(self.{_value});i+=16 )
		{
			if( (i%256)==0 ){
				print '  'xdepth;
				print 'path/row\n';
				++row;
			}
			print '  'xdepth;
			for( var j=0;j<16;++j )
			{
				print sprintf( '%02X ', ord( substr( self.{_value},i+j,1)));
			}
			print '\n';
		}
	}
}


1;

