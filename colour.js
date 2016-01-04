use FindBin;
use lib "$FindBin::Bin/lib";
use Minecraft;
use Minecraft::Projection;
use Minecraft::MapTiles;
use Getopt::Long;

BEGIN { do "$FindBin::Bin/config/colours"; }

my $point;
my $ll;
my $help;
if( !GetOptions (
  "point=s"   => \$point,
  "ll"  => \$ll,
  "help"  => \$help,
)) {
	print STDERR ("Error in command line arguments\n");
	help();
	exit( 1 );
}
if( $help )
{
	help();
	exit( 0 );
}

sub help
{
	print "$0 [--ll] --point <x>,<y>\n";
}

if( !defined $point )
{
	die "Please define a point";
}
my( $x,$y ) = split( ",", $point );

my( $lat,$long );
if( $ll )
{
	($lat,$long)=( $x,$y);
}

if( !-d "$FindBin::Bin/var" ) { mkdir( "$FindBin::Bin/var" ); }
if( !-d "$FindBin::Bin/var/tiles" ) { mkdir( "$FindBin::Bin/var/tiles" ); }

my $tiles = new Minecraft::MapTiles(
	zoom=>19,
	spread=>3,
	width=>256,
	height=>256,
	dir=>"$FindBin::Bin/var/tiles",
	url=>"http://b.tile.openstreetmap.org/",
	default_block=>1,
);

my @colours = $tiles->spread_colours( $lat,$long );
my $scores = {};
foreach my $col ( @colours )
{
	$scores->{$col}++;
}

print "   COUNT |      COLOUR | BLOCK\n";
print "---------+-------------+--------\n";
foreach my $col ( sort { $scores->{$a}<=>$scores->{$b} } keys %$scores )
{
	my $block = $Minecraft::Config::COLOURS->{$col};
	print sprintf( "%8d | %11s | %s\n", $scores->{$col}, $col, defined $block?$block:"???" );
}
exit 0;
