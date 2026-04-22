<?php
header('Content-Type: application/json');
header('X-Content-Type-Options: nosniff');

require_once __DIR__ . '/config.php';

$action = $_GET['action'] ?? $_POST['action'] ?? '';

try {
    switch ($action) {

        // ── LIST / SEARCH / FILTER ─────────────────────────────────────
        case 'list':
            $cat    = trim($_GET['category'] ?? '');
            $search = trim($_GET['search']   ?? '');

            $sql    = 'SELECT * FROM products WHERE 1=1';
            $params = [];
            $types  = '';

            if ($cat && $cat !== 'All Items') {
                $sql    .= ' AND category = ?';
                $params[] = $cat;
                $types   .= 's';
            }
            if ($search !== '') {
                $sql    .= ' AND product_name LIKE ?';
                $params[] = '%' . $search . '%';
                $types   .= 's';
            }
            $sql .= ' ORDER BY category, product_name ASC';

            $stmt = $conn->prepare($sql);
            if ($params) $stmt->bind_param($types, ...$params);
            $stmt->execute();
            $rows = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

            echo json_encode(['success' => true, 'products' => $rows]);
            break;

        // ── GET SINGLE ─────────────────────────────────────────────────
        case 'get':
            $id = intval($_GET['id'] ?? 0);
            if (!$id) throw new Exception('Invalid product ID');

            $stmt = $conn->prepare('SELECT * FROM products WHERE id = ?');
            $stmt->bind_param('i', $id);
            $stmt->execute();
            $row = $stmt->get_result()->fetch_assoc();
            if (!$row) throw new Exception('Product not found');

            echo json_encode(['success' => true, 'product' => $row]);
            break;

        // ── CREATE ─────────────────────────────────────────────────────
        case 'create':
            $name  = trim($_POST['product_name'] ?? '');
            $price = floatval($_POST['price']    ?? 0);
            $stock = intval($_POST['stock']      ?? 0);
            $cat   = trim($_POST['category']     ?? 'Other');

            if ($name === '') throw new Exception('Product name is required');
            if ($price < 0)   throw new Exception('Price cannot be negative');
            if ($stock < 0)   throw new Exception('Stock cannot be negative');

            $image = null;
            if (!empty($_FILES['image']['name'])) {
                $image = handleUpload($_FILES['image']);
            }

            $stmt = $conn->prepare(
                'INSERT INTO products (product_name, price, stock, category, image) VALUES (?,?,?,?,?)'
            );
            $stmt->bind_param('sdiss', $name, $price, $stock, $cat, $image);
            $stmt->execute();

            echo json_encode([
                'success' => true,
                'message' => 'Product added!',
                'id'      => $conn->insert_id
            ]);
            break;

        // ── UPDATE ─────────────────────────────────────────────────────
        case 'update':
            $id    = intval($_POST['id']           ?? 0);
            $name  = trim($_POST['product_name']   ?? '');
            $price = floatval($_POST['price']       ?? 0);
            $stock = intval($_POST['stock']         ?? 0);
            $cat   = trim($_POST['category']        ?? 'Other');

            if (!$id)         throw new Exception('Invalid product ID');
            if ($name === '') throw new Exception('Product name is required');

            // Fetch existing record
            $s = $conn->prepare('SELECT image FROM products WHERE id = ?');
            $s->bind_param('i', $id);
            $s->execute();
            $existing = $s->get_result()->fetch_assoc();
            if (!$existing) throw new Exception('Product not found');

            $image = $existing['image'];

            // Replace image only when a new one is uploaded
            if (!empty($_FILES['image']['name'])) {
                $newImg = handleUpload($_FILES['image']);
                // Delete old file safely
                if ($image) {
                    $old = UPLOAD_DIR . basename($image);
                    if (file_exists($old)) @unlink($old);
                }
                $image = $newImg;
            }

            $stmt = $conn->prepare(
                'UPDATE products SET product_name=?, price=?, stock=?, category=?, image=? WHERE id=?'
            );
            $stmt->bind_param('sdissi', $name, $price, $stock, $cat, $image, $id);
            $stmt->execute();

            echo json_encode(['success' => true, 'message' => 'Product updated!']);
            break;

        // ── DELETE ─────────────────────────────────────────────────────
        case 'delete':
            $id = intval($_POST['id'] ?? 0);
            if (!$id) throw new Exception('Invalid product ID');

            $s = $conn->prepare('SELECT image FROM products WHERE id = ?');
            $s->bind_param('i', $id);
            $s->execute();
            $row = $s->get_result()->fetch_assoc();
            if (!$row) throw new Exception('Product not found');

            $stmt = $conn->prepare('DELETE FROM products WHERE id = ?');
            $stmt->bind_param('i', $id);
            $stmt->execute();
            if ($stmt->affected_rows < 1) throw new Exception('Delete failed');

            // Remove image file
            if (!empty($row['image'])) {
                $fp = UPLOAD_DIR . basename($row['image']);
                if (file_exists($fp)) @unlink($fp);
            }

            echo json_encode(['success' => true, 'message' => 'Product deleted!']);
            break;

        // ── DEDUCT STOCK AFTER PAYMENT ─────────────────────────────────
        case 'deduct_stock':
            $body  = json_decode(file_get_contents('php://input'), true);
            $items = $body['items'] ?? [];

            if (!is_array($items) || empty($items)) {
                throw new Exception('No items provided');
            }

            $conn->begin_transaction();
            try {
                $check  = $conn->prepare(
                    'SELECT id, product_name, stock FROM products WHERE id = ? FOR UPDATE'
                );
                $update = $conn->prepare(
                    'UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?'
                );

                foreach ($items as $item) {
                    $pid = intval($item['id']  ?? 0);
                    $qty = intval($item['qty'] ?? 0);

                    if ($pid <= 0 || $qty <= 0) continue;

                    $check->bind_param('i', $pid);
                    $check->execute();
                    $row = $check->get_result()->fetch_assoc();

                    if (!$row) throw new Exception("Product ID $pid not found");
                    if ($row['stock'] < $qty) {
                        throw new Exception(
                            "Not enough stock for \"{$row['product_name']}\". " .
                            "Available: {$row['stock']}, requested: $qty"
                        );
                    }

                    $update->bind_param('iii', $qty, $pid, $qty);
                    $update->execute();

                    if ($update->affected_rows < 1) {
                        throw new Exception("Stock update failed for \"{$row['product_name']}\"");
                    }
                }

                $conn->commit();
                echo json_encode(['success' => true, 'message' => 'Stock updated!']);

            } catch (Exception $e) {
                $conn->rollback();
                throw $e;
            }
            break;

        default:
            throw new Exception('Unknown action: ' . htmlspecialchars($action));
    }

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}

// ── IMAGE UPLOAD HELPER ────────────────────────────────────────────
function handleUpload(array $file): string {
    if ($file['error'] !== UPLOAD_ERR_OK) {
        $map = [
            UPLOAD_ERR_INI_SIZE   => 'File exceeds server size limit',
            UPLOAD_ERR_FORM_SIZE  => 'File exceeds form size limit',
            UPLOAD_ERR_PARTIAL    => 'File only partially uploaded',
            UPLOAD_ERR_NO_TMP_DIR => 'Missing temp folder on server',
            UPLOAD_ERR_CANT_WRITE => 'Failed to write file to disk',
            UPLOAD_ERR_EXTENSION  => 'Upload blocked by server extension',
        ];
        throw new Exception($map[$file['error']] ?? 'Upload error ' . $file['error']);
    }

    if ($file['size'] > MAX_IMG_SIZE) {
        throw new Exception('Image too large. Maximum size is 5MB.');
    }

    $finfo    = new finfo(FILEINFO_MIME_TYPE);
    $mimeType = $finfo->file($file['tmp_name']);
    if (!in_array($mimeType, ALLOWED_MIME, true)) {
        throw new Exception('Invalid file type. Allowed: JPG, PNG, GIF, WEBP.');
    }

    if (!is_dir(UPLOAD_DIR)) {
        if (!mkdir(UPLOAD_DIR, 0755, true)) {
            throw new Exception('Cannot create uploads folder. Check permissions.');
        }
    }
    if (!is_writable(UPLOAD_DIR)) {
        throw new Exception('Uploads folder is not writable. Run: chmod 755 uploads/');
    }

    $ext      = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
    $filename = 'prod_' . uniqid('', true) . '.' . $ext;
    $dest     = UPLOAD_DIR . $filename;

    if (!move_uploaded_file($file['tmp_name'], $dest)) {
        throw new Exception('Failed to save the uploaded image.');
    }

    return UPLOAD_URL . $filename;
}
?>
