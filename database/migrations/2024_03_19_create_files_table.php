use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateFilesTable extends Migration
{
public function up()
{
Schema::create('files', function (Blueprint $table) {
$table->id();
$table->string('name');
$table->string('original_name');
$table->string('mime_type');
$table->string('path');
$table->bigInteger('size');
$table->string('type')->nullable(); // Tipo de archivo (image, pdf, office, etc.)
$table->text('description')->nullable();
$table->foreignId('folder_id')->nullable()->constrained()->onDelete('cascade');
$table->timestamps();
$table->softDeletes();
});
}

public function down()
{
Schema::dropIfExists('files');
}
}