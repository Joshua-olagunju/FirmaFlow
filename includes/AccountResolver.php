<?php
/**
 * AccountResolver
 * - Resolves account IDs for a company using:
 *   1) company_settings
 *   2) standard account codes (signup chart)
 *   3) name/code pattern matching
 * - By default it will NOT auto-create accounts at runtime.
 *   Pass $createIfMissing = true to get(..., true) to create via createDefaultAccount().
 */

class AccountResolver
{
    protected PDO $pdo;
    protected int $companyId;
    protected array $cache = [];

    public function __construct(PDO $pdo, int $companyId)
    {
        $this->pdo = $pdo;
        $this->companyId = $companyId;
    }

    /**
     * Resolve an account id for $key.
     * - returns int account_id when found or created (if $createIfMissing = true)
     * - returns null if not found and creation not allowed
     */
    public function get(string $key, bool $createIfMissing = false): ?int
    {
        $key = trim(strval($key));
        if ($key === '') {
            return null;
        }

        if (isset($this->cache[$key])) {
            return $this->cache[$key];
        }

        // 1) company settings mapping
        $settingKey = $this->mapKeyToSetting($key);
        if ($settingKey !== null) {
            $val = $this->getCompanySetting($settingKey);
            if ($val !== null && is_numeric($val) && (int)$val > 0) {
                $this->cache[$key] = (int)$val;
                return $this->cache[$key];
            }
        }

        // 2) standard code lookup (accounts created at signup use these codes)
        $accountId = $this->findAccountByStandardCode($key);
        if ($accountId !== null) {
            $this->cache[$key] = $accountId;
            return $this->cache[$key];
        }

        // 3) pattern/name/code matching
        $account = $this->findAccountByPattern($key);
        if ($account && !empty($account['id'])) {
            $this->cache[$key] = (int)$account['id'];
            return $this->cache[$key];
        }

        // 4) optionally create
        if ($createIfMissing) {
            $newId = $this->createDefaultAccount($key);
            $this->cache[$key] = $newId;
            return $this->cache[$key];
        }

        // not found, no auto-create: return null
        error_log("AccountResolver: account '{$key}' not found for company {$this->companyId} (no auto-create).");
        return null;
    }

    /**
     * Get a single company setting value safely.
     * Returns the raw value or null.
     */
    protected function getCompanySetting(string $settingKey)
    {
        try {
            // check table exists
            $stmt = $this->pdo->query("SHOW TABLES LIKE 'company_settings'");
            if ($stmt === false || $stmt->rowCount() === 0) {
                return null;
            }

            // check column exists
            $colStmt = $this->pdo->prepare("SHOW COLUMNS FROM company_settings LIKE ?");
            $colStmt->execute([$settingKey]);
            if ($colStmt->rowCount() === 0) {
                return null;
            }

            // fetch setting
            $get = $this->pdo->prepare("SELECT {$settingKey} FROM company_settings WHERE company_id = ? LIMIT 1");
            $get->execute([$this->companyId]);
            $row = $get->fetch(PDO::FETCH_ASSOC);
            if (!$row || !array_key_exists($settingKey, $row)) {
                return null;
            }

            $val = $row[$settingKey];

            // special case for JSON array of cash_account_ids
            if ($settingKey === 'cash_account_ids' && is_string($val)) {
                $ids = json_decode($val, true);
                if (is_array($ids) && count($ids) > 0) {
                    return $ids[0];
                }
                return null;
            }

            return $val;
        } catch (Exception $e) {
            // don't break resolution on errors - return null and let other methods try
            error_log("AccountResolver::getCompanySetting error: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Look up accounts created during signup by their standard code.
     * Returns int id or null.
     */
    protected function findAccountByStandardCode(string $key): ?int
    {
        // These codes MUST match exactly what createMinimalChartOfAccounts() creates in auth.php
        $standardCodes = [
            'cash' => '1000',
            'ar' => '1200',
            'inventory' => '1300',
            'ap' => '2000',
            'retained' => '3000',
            'sales' => '4000',
            'cogs' => '5000',
        ];

        $code = $standardCodes[$key] ?? null;
        if ($code === null) {
            return null;
        }

        try {
            $stmt = $this->pdo->prepare("SELECT id FROM accounts WHERE company_id = ? AND code = ? AND is_active = 1 LIMIT 1");
            $stmt->execute([$this->companyId, $code]);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            return $row ? (int)$row['id'] : null;
        } catch (Exception $e) {
            error_log("AccountResolver::findAccountByStandardCode error: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Pattern-based lookup (name LIKE ... OR code = ...).
     * Returns account row (assoc) or null.
     */
    protected function findAccountByPattern(string $key): ?array
    {
        $patterns = $this->getPatterns($key);
        if (empty($patterns['names']) && empty($patterns['codes'])) {
            return null;
        }

        $sql = "SELECT id, name, code, type FROM accounts WHERE company_id = ? AND is_active = 1";
        $params = [$this->companyId];
        $conds = [];

        if (!empty($patterns['names'])) {
            $nameConds = [];
            foreach ($patterns['names'] as $n) {
                $nameConds[] = "LOWER(name) LIKE ?";
                $params[] = '%' . strtolower($n) . '%';
            }
            $conds[] = '(' . implode(' OR ', $nameConds) . ')';
        }

        if (!empty($patterns['codes'])) {
            $codeConds = [];
            foreach ($patterns['codes'] as $c) {
                $codeConds[] = "code = ?";
                $params[] = $c;
            }
            $conds[] = '(' . implode(' OR ', $codeConds) . ')';
        }

        if (!empty($conds)) {
            $sql .= " AND (" . implode(' OR ', $conds) . ")";
        }

        if (!empty($patterns['type'])) {
            $sql .= " AND type = ?";
            $params[] = $patterns['type'];
        }

        $sql .= " ORDER BY code ASC LIMIT 1";

        try {
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute($params);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            return $row ?: null;
        } catch (Exception $e) {
            error_log("AccountResolver::findAccountByPattern error: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Patterns for common keys
     */
    protected function getPatterns(string $key): array
    {
        $map = [
            'cash' => [
                'names' => ['cash', 'bank', 'checking', 'savings'],
                'codes' => ['1000', '1100', '1110'],
                'type' => 'asset'
            ],
            'sales' => [
                'names' => ['sales', 'sales revenue', 'revenue', 'income'],
                'codes' => ['4000', '4100', '4200'],
                'type' => 'income'
            ],
            'cogs' => [
                'names' => ['cost of goods', 'cogs', 'cost of sales', 'purchases'],
                'codes' => ['5000', '5100'],
                'type' => 'expense'
            ],
            'inventory' => [
                'names' => ['inventory', 'stock', 'merchandise'],
                'codes' => ['1300', '1003', '1130'],
                'type' => 'asset'
            ],
            'ar' => [
                'names' => ['accounts receivable', 'receivable', 'trade receivable'],
                'codes' => ['1200', '1120'],
                'type' => 'asset'
            ],
            'ap' => [
                'names' => ['accounts payable', 'payable', 'trade payable'],
                'codes' => ['2000', '2100'],
                'type' => 'liability'
            ],
            'retained' => [
                'names' => ['retained earnings', 'retained', 'owner equity', 'opening balance'],
                'codes' => ['3000', '3200'],
                'type' => 'equity'
            ],
        ];

        return $map[$key] ?? ['names' => [], 'codes' => [], 'type' => null];
    }

    /**
     * Safely create a default account for a key.
     * - Ensures uniqueness of code for the company
     * - Inserts account and updates company_settings if applicable
     * - Returns int account_id
     *
     * NOTE: This method will perform inserts and updates. Caller may wrap in a transaction if desired.
     */
    protected function createDefaultAccount(string $key): int
    {
        // default definitions (match signup account codes exactly)
        $defaults = [
            'cash' => ['name' => 'Cash & Bank', 'code' => '1000', 'type' => 'asset'],
            'sales' => ['name' => 'Sales Revenue', 'code' => '4000', 'type' => 'income'],
            'cogs' => ['name' => 'Cost of Goods Sold', 'code' => '5000', 'type' => 'expense'],
            'inventory' => ['name' => 'Inventory', 'code' => '1300', 'type' => 'asset'],
            'ar' => ['name' => 'Accounts Receivable', 'code' => '1200', 'type' => 'asset'],
            'ap' => ['name' => 'Accounts Payable', 'code' => '2000', 'type' => 'liability'],
            'retained' => ['name' => 'Retained Earnings', 'code' => '3000', 'type' => 'equity'],
        ];

        $cfg = $defaults[$key] ?? ['name' => ucfirst($key), 'code' => '99' . mt_rand(100, 999), 'type' => 'asset'];
        $name = $cfg['name'];
        $code = $cfg['code'];
        $type = $cfg['type'];

        try {
            // If account already exists (by code or exact name) return it
            $check = $this->pdo->prepare("SELECT id FROM accounts WHERE company_id = ? AND (code = ? OR LOWER(name) = LOWER(?)) LIMIT 1");
            $check->execute([$this->companyId, $code, $name]);
            $existing = $check->fetch(PDO::FETCH_ASSOC);
            if ($existing && !empty($existing['id'])) {
                return (int)$existing['id'];
            }

            // Ensure code is unique for this company. If not, generate fallback
            $codeCheck = $this->pdo->prepare("SELECT id FROM accounts WHERE company_id = ? AND code = ? LIMIT 1");
            $tries = 0;
            while (true) {
                $codeCheck->execute([$this->companyId, $code]);
                if (!$codeCheck->fetch()) {
                    break; // unique
                }
                $code = '99' . mt_rand(100, 999);
                $tries++;
                if ($tries > 10) {
                    throw new RuntimeException("Unable to generate unique account code for key {$key}");
                }
            }

            // Insert
            $ins = $this->pdo->prepare("INSERT INTO accounts (company_id, code, name, type, is_active, created_at) VALUES (?, ?, ?, ?, 1, NOW())");
            $ins->execute([$this->companyId, $code, $name, $type]);
            $accountId = (int)$this->pdo->lastInsertId();

            // Update company settings if the key maps to a company_settings column
            $this->updateCompanySettingForAccount($key, $accountId);

            return $accountId;
        } catch (Exception $e) {
            error_log("AccountResolver::createDefaultAccount error: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Update or create company_settings row with the new account id (safe)
     */
    protected function updateCompanySettingForAccount(string $key, int $accountId): void
    {
        $settingKey = $this->mapKeyToSetting($key);
        if ($settingKey === null) {
            return;
        }

        try {
            $check = $this->pdo->prepare("SELECT id FROM company_settings WHERE company_id = ? LIMIT 1");
            $check->execute([$this->companyId]);
            $exists = $check->fetch(PDO::FETCH_ASSOC);

            if ($exists) {
                if ($settingKey === 'cash_account_ids') {
                    $upd = $this->pdo->prepare("UPDATE company_settings SET {$settingKey} = JSON_ARRAY(?) WHERE company_id = ?");
                    $upd->execute([$accountId, $this->companyId]);
                } else {
                    $upd = $this->pdo->prepare("UPDATE company_settings SET {$settingKey} = ? WHERE company_id = ?");
                    $upd->execute([$accountId, $this->companyId]);
                }
            } else {
                // Build insert values in the same order as fields (simplified insert)
                $sales = $settingKey === 'sales_account_id' ? $accountId : null;
                $ar = $settingKey === 'ar_account_id' ? $accountId : null;
                $ap = $settingKey === 'ap_account_id' ? $accountId : null;
                $inventory = $settingKey === 'inventory_account_id' ? $accountId : null;
                $cogs = $settingKey === 'cogs_account_id' ? $accountId : null;
                $retained = $settingKey === 'retained_earnings_account_id' ? $accountId : null;
                $cashJson = $settingKey === 'cash_account_ids' ? json_encode([$accountId]) : null;

                $ins = $this->pdo->prepare("
                    INSERT INTO company_settings (
                        company_id, accounting_method,
                        sales_account_id, ar_account_id, ap_account_id,
                        inventory_account_id, cogs_account_id, retained_earnings_account_id,
                        cash_account_ids, created_at
                    ) VALUES (?, 'accrual', ?, ?, ?, ?, ?, ?, ?, NOW())
                ");
                $ins->execute([$this->companyId, $sales, $ar, $ap, $inventory, $cogs, $retained, $cashJson]);
            }
        } catch (Exception $e) {
            // Log but do not throw - settings update failure should not break account creation
            error_log("AccountResolver::updateCompanySettingForAccount error: " . $e->getMessage());
        }
    }

    /**
     * Map logical key to company_settings column.
     */
    protected function mapKeyToSetting(string $key): ?string
    {
        $map = [
            'sales' => 'sales_account_id',
            'cogs' => 'cogs_account_id',
            'inventory' => 'inventory_account_id',
            'ar' => 'ar_account_id',
            'ap' => 'ap_account_id',
            'cash' => 'cash_account_ids',
            'cash_primary' => 'cash_account_ids',
            'retained' => 'retained_earnings_account_id',
        ];
        return $map[$key] ?? null;
    }

    /**
     * Clear internal cache
     */
    public function clearCache(): void
    {
        $this->cache = [];
    }

    /**
     * Return cached account ids
     */
    public function getCachedAccounts(): array
    {
        return $this->cache;
    }

    /* ----------------
       Convenience methods (do NOT auto-create by default)
       Pass true to create if you want runtime auto-creation.
       ---------------- */
    public function cash(bool $createIfMissing = false): ?int { return $this->get('cash', $createIfMissing); }
    public function sales(bool $createIfMissing = false): ?int { return $this->get('sales', $createIfMissing); }
    public function cogs(bool $createIfMissing = false): ?int { return $this->get('cogs', $createIfMissing); }
    public function inventory(bool $createIfMissing = false): ?int { return $this->get('inventory', $createIfMissing); }
    public function ar(bool $createIfMissing = false): ?int { return $this->get('ar', $createIfMissing); }
    public function ap(bool $createIfMissing = false): ?int { return $this->get('ap', $createIfMissing); }
    public function retained(bool $createIfMissing = false): ?int { return $this->get('retained', $createIfMissing); }
}
