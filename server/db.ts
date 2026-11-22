import fs from 'node:fs';
import path from 'node:path';
import mysql from 'mysql2/promise';
import type { Pool, RowDataPacket } from 'mysql2/promise';
import type { PortalSubmission, RemarkEntry, SubmissionStatus } from '../src/types/portal.ts';
import { SEED_SUBMISSIONS } from '../src/data/seedData.ts';
import type { AuthRole } from './security.ts';

export interface StoredUser {
  id: string;
  role: AuthRole;
  fullName: string;
  email: string;
  passwordHash: string;
  purok: string;
  address: string;
  phone: string;
  officialTitle: string;
  createdAt: string;
}

export interface PublicUser {
  id: string;
  role: AuthRole;
  fullName: string;
  email: string;
  purok: string;
  address: string;
  phone: string;
  officialTitle: string;
}

export function toPublicUser(user: StoredUser): PublicUser {
  return {
    id: user.id,
    role: user.role,
    fullName: user.fullName,
    email: user.email,
    purok: user.purok,
    address: user.address,
    phone: user.phone,
    officialTitle: user.officialTitle,
  };
}

export interface PortalRepository {
  driverName: 'mysql-xampp' | 'local-file';
  getUserByEmail(email: string): Promise<StoredUser | null>;
  getUserById(id: string): Promise<StoredUser | null>;
  countStaffUsers(): Promise<number>;
  listStaffUsers(): Promise<PublicUser[]>;
  createUser(user: StoredUser): Promise<PublicUser>;
  listSubmissions(): Promise<PortalSubmission[]>;
  listSubmissionsByResident(residentId: string): Promise<PortalSubmission[]>;
  findSubmissionByReference(referenceNumber: string): Promise<PortalSubmission | null>;
  findSubmissionById(id: string): Promise<PortalSubmission | null>;
  createSubmission(submission: PortalSubmission): Promise<PortalSubmission>;
  updateSubmissionStatus(
    submissionId: string,
    nextStatus: SubmissionStatus,
    remark: RemarkEntry,
    updatedAt: string,
  ): Promise<PortalSubmission | null>;
  resetSampleSubmissions(): Promise<PortalSubmission[]>;
}

function toMysqlDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return new Date().toISOString().slice(0, 19).replace('T', ' ');
  }
  return d.toISOString().slice(0, 19).replace('T', ' ');
}

function fromMysqlDateTime(val: unknown): string {
  if (val instanceof Date) {
    return val.toISOString();
  }
  if (typeof val === 'string' && val.trim()) {
    const normalized = val.includes('T') ? val : `${val.replace(' ', 'T')}Z`;
    const d = new Date(normalized);
    if (!Number.isNaN(d.getTime())) return d.toISOString();
    return val;
  }
  return new Date().toISOString();
}

class MySqlXamppRepository implements PortalRepository {
  public readonly driverName = 'mysql-xampp' as const;
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  private mapUserRow(row: RowDataPacket): StoredUser {
    return {
      id: String(row.id),
      role: row.role === 'staff' ? 'staff' : 'resident',
      fullName: String(row.full_name),
      email: String(row.email),
      passwordHash: String(row.password_hash),
      purok: String(row.purok || ''),
      address: String(row.address || ''),
      phone: String(row.phone || ''),
      officialTitle: String(row.official_title || ''),
      createdAt: fromMysqlDateTime(row.created_at),
    };
  }

  async getUserByEmail(email: string): Promise<StoredUser | null> {
    const [rows] = await this.pool.execute<RowDataPacket[]>(
      'SELECT * FROM users WHERE LOWER(email) = LOWER(?) LIMIT 1',
      [email.trim()],
    );
    return rows.length > 0 ? this.mapUserRow(rows[0]) : null;
  }

  async getUserById(id: string): Promise<StoredUser | null> {
    const [rows] = await this.pool.execute<RowDataPacket[]>(
      'SELECT * FROM users WHERE id = ? LIMIT 1',
      [id],
    );
    return rows.length > 0 ? this.mapUserRow(rows[0]) : null;
  }

  async countStaffUsers(): Promise<number> {
    const [rows] = await this.pool.execute<RowDataPacket[]>(
      "SELECT COUNT(*) AS cnt FROM users WHERE role = 'staff'",
    );
    return Number(rows[0]?.cnt ?? 0);
  }

  async listStaffUsers(): Promise<PublicUser[]> {
    const [rows] = await this.pool.execute<RowDataPacket[]>(
      "SELECT * FROM users WHERE role = 'staff' ORDER BY created_at ASC",
    );
    return rows.map((r) => toPublicUser(this.mapUserRow(r)));
  }

  async createUser(user: StoredUser): Promise<PublicUser> {
    await this.pool.execute(
      `INSERT INTO users (id, role, full_name, email, password_hash, purok, address, phone, official_title, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        user.id,
        user.role,
        user.fullName,
        user.email.toLowerCase(),
        user.passwordHash,
        user.purok,
        user.address,
        user.phone,
        user.officialTitle,
        toMysqlDateTime(user.createdAt),
      ],
    );
    return toPublicUser(user);
  }

  private async attachRemarks(
    subRows: RowDataPacket[],
  ): Promise<PortalSubmission[]> {
    if (subRows.length === 0) return [];
    const ids = subRows.map((r) => String(r.id));
    const placeholders = ids.map(() => '?').join(',');
    const [remarkRows] = await this.pool.execute<RowDataPacket[]>(
      `SELECT * FROM submission_remarks WHERE submission_id IN (${placeholders}) ORDER BY timestamp ASC`,
      ids,
    );

    const remarksBySub = new Map<string, RemarkEntry[]>();
    for (const r of remarkRows) {
      const sid = String(r.submission_id);
      const entry: RemarkEntry = {
        id: String(r.id),
        timestamp: fromMysqlDateTime(r.timestamp),
        status: r.status as SubmissionStatus,
        authorName: String(r.author_name),
        authorRole: String(r.author_role),
        note: String(r.note),
      };
      const existing = remarksBySub.get(sid);
      if (existing) existing.push(entry);
      else remarksBySub.set(sid, [entry]);
    }

    return subRows.map((r) => ({
      id: String(r.id),
      referenceNumber: String(r.reference_number),
      kind: r.kind === 'service' ? 'service' : 'issue',
      title: String(r.title),
      category: String(r.category) as PortalSubmission['category'],
      purok: String(r.purok),
      location: String(r.location),
      description: String(r.description),
      urgency: (r.urgency || undefined) as PortalSubmission['urgency'],
      photoDataUrl: r.photo_data_url ? String(r.photo_data_url) : undefined,
      photoName: r.photo_name ? String(r.photo_name) : undefined,
      purpose: r.purpose ? String(r.purpose) : undefined,
      preferredPickupDate: r.preferred_pickup_date
        ? String(r.preferred_pickup_date)
        : undefined,
      residentId: String(r.resident_id),
      residentName: String(r.resident_name),
      residentContact: String(r.resident_contact),
      status: r.status as SubmissionStatus,
      createdAt: fromMysqlDateTime(r.created_at),
      updatedAt: fromMysqlDateTime(r.updated_at),
      remarks: remarksBySub.get(String(r.id)) || [],
    }));
  }

  async listSubmissions(): Promise<PortalSubmission[]> {
    const [rows] = await this.pool.execute<RowDataPacket[]>(
      'SELECT * FROM submissions ORDER BY created_at DESC',
    );
    return this.attachRemarks(rows);
  }

  async listSubmissionsByResident(residentId: string): Promise<PortalSubmission[]> {
    const [rows] = await this.pool.execute<RowDataPacket[]>(
      'SELECT * FROM submissions WHERE resident_id = ? ORDER BY created_at DESC',
      [residentId],
    );
    return this.attachRemarks(rows);
  }

  async findSubmissionByReference(
    referenceNumber: string,
  ): Promise<PortalSubmission | null> {
    const [rows] = await this.pool.execute<RowDataPacket[]>(
      'SELECT * FROM submissions WHERE UPPER(reference_number) = UPPER(?) LIMIT 1',
      [referenceNumber.trim()],
    );
    const list = await this.attachRemarks(rows);
    return list[0] || null;
  }

  async findSubmissionById(id: string): Promise<PortalSubmission | null> {
    const [rows] = await this.pool.execute<RowDataPacket[]>(
      'SELECT * FROM submissions WHERE id = ? LIMIT 1',
      [id],
    );
    const list = await this.attachRemarks(rows);
    return list[0] || null;
  }

  async createSubmission(submission: PortalSubmission): Promise<PortalSubmission> {
    const conn = await this.pool.getConnection();
    try {
      await conn.beginTransaction();
      await conn.execute(
        `INSERT INTO submissions (
          id, reference_number, kind, title, category, purok, location,
          description, urgency, photo_data_url, photo_name, purpose,
          preferred_pickup_date, resident_id, resident_name, resident_contact,
          status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          submission.id,
          submission.referenceNumber,
          submission.kind,
          submission.title,
          submission.category,
          submission.purok,
          submission.location,
          submission.description,
          submission.urgency ?? null,
          submission.photoDataUrl ?? null,
          submission.photoName ?? null,
          submission.purpose ?? null,
          submission.preferredPickupDate ?? null,
          submission.residentId,
          submission.residentName,
          submission.residentContact,
          submission.status,
          toMysqlDateTime(submission.createdAt),
          toMysqlDateTime(submission.updatedAt),
        ],
      );

      for (const rem of submission.remarks) {
        await conn.execute(
          `INSERT INTO submission_remarks (id, submission_id, timestamp, status, author_name, author_role, note)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            rem.id,
            submission.id,
            toMysqlDateTime(rem.timestamp),
            rem.status,
            rem.authorName,
            rem.authorRole,
            rem.note,
          ],
        );
      }

      await conn.commit();
      return submission;
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  async updateSubmissionStatus(
    submissionId: string,
    nextStatus: SubmissionStatus,
    remark: RemarkEntry,
    updatedAt: string,
  ): Promise<PortalSubmission | null> {
    const conn = await this.pool.getConnection();
    try {
      await conn.beginTransaction();
      const [res] = await conn.execute<mysql.ResultSetHeader>(
        'UPDATE submissions SET status = ?, updated_at = ? WHERE id = ?',
        [nextStatus, toMysqlDateTime(updatedAt), submissionId],
      );
      if (res.affectedRows === 0) {
        await conn.rollback();
        return null;
      }

      await conn.execute(
        `INSERT INTO submission_remarks (id, submission_id, timestamp, status, author_name, author_role, note)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          remark.id,
          submissionId,
          toMysqlDateTime(remark.timestamp),
          remark.status,
          remark.authorName,
          remark.authorRole,
          remark.note,
        ],
      );

      await conn.commit();
      return this.findSubmissionById(submissionId);
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  async resetSampleSubmissions(): Promise<PortalSubmission[]> {
    const conn = await this.pool.getConnection();
    try {
      await conn.beginTransaction();
      await conn.execute('DELETE FROM submission_remarks');
      await conn.execute('DELETE FROM submissions');
      await conn.commit();
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }

    for (const item of SEED_SUBMISSIONS) {
      await this.createSubmission(item);
    }
    return this.listSubmissions();
  }
}

interface LocalDbPayload {
  users: StoredUser[];
  submissions: PortalSubmission[];
}

class LocalFileRepository implements PortalRepository {
  public readonly driverName = 'local-file' as const;
  private filePath: string;
  private data: LocalDbPayload;

  constructor(filePath: string) {
    this.filePath = filePath;
    this.data = this.load();
  }

  private load(): LocalDbPayload {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf8');
        const parsed = JSON.parse(raw) as Partial<LocalDbPayload>;
        return {
          users: Array.isArray(parsed.users) ? parsed.users : [],
          submissions:
            Array.isArray(parsed.submissions) && parsed.submissions.length > 0
              ? parsed.submissions
              : [...SEED_SUBMISSIONS],
        };
      }
    } catch {
      // Recover with seeded store
    }
    const initial: LocalDbPayload = {
      users: [],
      submissions: [...SEED_SUBMISSIONS],
    };
    this.save(initial);
    return initial;
  }

  private save(payload: LocalDbPayload): void {
    const dir = path.dirname(this.filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const tmp = `${this.filePath}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(payload, null, 2), 'utf8');
    fs.renameSync(tmp, this.filePath);
  }

  async getUserByEmail(email: string): Promise<StoredUser | null> {
    const target = email.trim().toLowerCase();
    return (
      this.data.users.find((u) => u.email.trim().toLowerCase() === target) || null
    );
  }

  async getUserById(id: string): Promise<StoredUser | null> {
    return this.data.users.find((u) => u.id === id) || null;
  }

  async countStaffUsers(): Promise<number> {
    return this.data.users.filter((u) => u.role === 'staff').length;
  }

  async listStaffUsers(): Promise<PublicUser[]> {
    return this.data.users.filter((u) => u.role === 'staff').map(toPublicUser);
  }

  async createUser(user: StoredUser): Promise<PublicUser> {
    const normalized: StoredUser = {
      ...user,
      email: user.email.trim().toLowerCase(),
    };
    this.data.users.push(normalized);
    this.save(this.data);
    return toPublicUser(normalized);
  }

  async listSubmissions(): Promise<PortalSubmission[]> {
    return [...this.data.submissions].sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt),
    );
  }

  async listSubmissionsByResident(residentId: string): Promise<PortalSubmission[]> {
    return this.data.submissions
      .filter((s) => s.residentId === residentId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async findSubmissionByReference(
    referenceNumber: string,
  ): Promise<PortalSubmission | null> {
    const target = referenceNumber.trim().toUpperCase();
    return (
      this.data.submissions.find(
        (s) => s.referenceNumber.trim().toUpperCase() === target,
      ) || null
    );
  }

  async findSubmissionById(id: string): Promise<PortalSubmission | null> {
    return this.data.submissions.find((s) => s.id === id) || null;
  }

  async createSubmission(submission: PortalSubmission): Promise<PortalSubmission> {
    this.data.submissions.unshift(submission);
    this.save(this.data);
    return submission;
  }

  async updateSubmissionStatus(
    submissionId: string,
    nextStatus: SubmissionStatus,
    remark: RemarkEntry,
    updatedAt: string,
  ): Promise<PortalSubmission | null> {
    const idx = this.data.submissions.findIndex((s) => s.id === submissionId);
    if (idx === -1) return null;

    const current = this.data.submissions[idx];
    const updated: PortalSubmission = {
      ...current,
      status: nextStatus,
      updatedAt,
      remarks: [...current.remarks, remark],
    };
    this.data.submissions[idx] = updated;
    this.save(this.data);
    return updated;
  }

  async resetSampleSubmissions(): Promise<PortalSubmission[]> {
    this.data.submissions = [...SEED_SUBMISSIONS];
    this.save(this.data);
    return this.listSubmissions();
  }
}

export async function createPortalRepository(): Promise<PortalRepository> {
  const host = process.env.MYSQL_HOST || '127.0.0.1';
  const port = Number.parseInt(process.env.MYSQL_PORT || '3306', 10) || 3306;
  const user = process.env.MYSQL_USER || 'root';
  const password = process.env.MYSQL_PASSWORD || '';
  const rawDb = process.env.MYSQL_DATABASE || 'barangay_portal';
  const database = /^[a-zA-Z0-9_]+$/.test(rawDb) ? rawDb : 'barangay_portal';

  try {
    const bootstrapConn = await mysql.createConnection({
      host,
      port,
      user,
      password,
      connectTimeout: 2000,
    });

    await bootstrapConn.query(
      `CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
    );
    await bootstrapConn.end();

    const pool = mysql.createPool({
      host,
      port,
      user,
      password,
      database,
      waitForConnections: true,
      connectionLimit: 10,
      connectTimeout: 2500,
    });

    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(64) NOT NULL PRIMARY KEY,
        role ENUM('resident', 'staff') NOT NULL,
        full_name VARCHAR(160) NOT NULL,
        email VARCHAR(190) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        purok VARCHAR(100) NOT NULL DEFAULT '',
        address VARCHAR(255) NOT NULL DEFAULT '',
        phone VARCHAR(40) NOT NULL DEFAULT '',
        official_title VARCHAR(120) NOT NULL DEFAULT '',
        created_at DATETIME NOT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS submissions (
        id VARCHAR(64) NOT NULL PRIMARY KEY,
        reference_number VARCHAR(40) NOT NULL UNIQUE,
        kind ENUM('issue', 'service') NOT NULL,
        title VARCHAR(255) NOT NULL,
        category VARCHAR(120) NOT NULL,
        purok VARCHAR(100) NOT NULL,
        location VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        urgency ENUM('Low', 'Medium', 'High') NULL,
        photo_data_url MEDIUMTEXT NULL,
        photo_name VARCHAR(255) NULL,
        purpose VARCHAR(255) NULL,
        preferred_pickup_date VARCHAR(20) NULL,
        resident_id VARCHAR(64) NOT NULL,
        resident_name VARCHAR(160) NOT NULL,
        resident_contact VARCHAR(40) NOT NULL,
        status ENUM('Received', 'In Progress', 'Resolved') NOT NULL DEFAULT 'Received',
        created_at DATETIME NOT NULL,
        updated_at DATETIME NOT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS submission_remarks (
        id VARCHAR(64) NOT NULL PRIMARY KEY,
        submission_id VARCHAR(64) NOT NULL,
        timestamp DATETIME NOT NULL,
        status ENUM('Received', 'In Progress', 'Resolved') NOT NULL,
        author_name VARCHAR(160) NOT NULL,
        author_role VARCHAR(120) NOT NULL,
        note TEXT NOT NULL,
        CONSTRAINT fk_remarks_submission
          FOREIGN KEY (submission_id) REFERENCES submissions(id)
          ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    const repo = new MySqlXamppRepository(pool);
    const existing = await repo.listSubmissions();
    if (existing.length === 0) {
      for (const item of SEED_SUBMISSIONS) {
        await repo.createSubmission(item);
      }
    }

    console.log(`[db] Connected to XAMPP MySQL (${host}:${port}/${database})`);
    return repo;
  } catch {
    const localPath = path.resolve(process.cwd(), 'server', 'data', 'portal-db.json');
    console.log(
      `[db] XAMPP MySQL not reachable on ${host}:${port}; using persistent server store (${localPath})`,
    );
    return new LocalFileRepository(localPath);
  }
}
