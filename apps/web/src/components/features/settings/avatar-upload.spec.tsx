import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AvatarUpload } from "./avatar-upload";

const mockPresignAvatar = vi.fn();
const mockUpdateAvatar = vi.fn();
const mockDeleteAvatar = vi.fn();

vi.mock("@web/services/user.service", () => ({
  userService: {
    presignAvatar: (...args: unknown[]) => mockPresignAvatar(...args),
    updateAvatar: (...args: unknown[]) => mockUpdateAvatar(...args),
    deleteAvatar: (...args: unknown[]) => mockDeleteAvatar(...args),
  },
}));

// Simula o fetch para o PUT no S3
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

const defaultProps = {
  currentAvatarUrl: null,
  userName: "João Silva",
  token: "fake-token",
  onUpdate: vi.fn(),
};

function makeFile(name = "avatar.jpg", type = "image/jpeg", sizeKB = 100) {
  const file = new File(["x"], name, { type });
  Object.defineProperty(file, "size", { value: sizeKB * 1024 });
  return file;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockFetch.mockResolvedValue({ ok: true });
});

describe("AvatarUpload", () => {
  it("renders current avatar or DiceBear fallback", () => {
    render(<AvatarUpload {...defaultProps} />);
    expect(screen.getByRole("img")).toBeInTheDocument();
  });

  it("renders avatar with current URL when provided", () => {
    render(
      <AvatarUpload {...defaultProps} currentAvatarUrl="https://example.com/avatar.jpg" />,
    );
    expect(screen.getByRole("img")).toHaveAttribute(
      "src",
      expect.stringContaining("example.com"),
    );
  });

  it("shows remove button only when user has a custom avatar", () => {
    const { rerender } = render(<AvatarUpload {...defaultProps} currentAvatarUrl={null} />);
    expect(screen.queryByRole("button", { name: /remover/i })).not.toBeInTheDocument();

    rerender(
      <AvatarUpload {...defaultProps} currentAvatarUrl="https://example.com/avatar.jpg" />,
    );
    expect(screen.getByRole("button", { name: /remover/i })).toBeInTheDocument();
  });

  it("rejects files larger than 2MB", async () => {
    render(<AvatarUpload {...defaultProps} />);
    const input = document.querySelector("input[type='file']") as HTMLInputElement;
    const bigFile = makeFile("big.jpg", "image/jpeg", 2100);

    await userEvent.upload(input, bigFile);

    await waitFor(() => {
      expect(screen.getByText(/arquivo muito grande/i)).toBeInTheDocument();
    });
    expect(mockPresignAvatar).not.toHaveBeenCalled();
  });

  it("rejects non-image file types", async () => {
    render(<AvatarUpload {...defaultProps} />);
    const input = document.querySelector("input[type='file']") as HTMLInputElement;
    const pdfFile = makeFile("doc.pdf", "application/pdf", 50);

    await userEvent.upload(input, pdfFile);

    await waitFor(() => {
      expect(screen.getByText(/jpeg, png ou webp/i)).toBeInTheDocument();
    });
    expect(mockPresignAvatar).not.toHaveBeenCalled();
  });

  it("uploads file and calls onUpdate on success", async () => {
    mockPresignAvatar.mockResolvedValue({
      data: {
        upload_url: "https://s3.amazonaws.com/bucket/avatar.jpg?token=x",
        final_url: "https://s3.amazonaws.com/bucket/avatar.jpg",
      },
    });
    mockUpdateAvatar.mockResolvedValue({ data: { user: {} } });

    const onUpdate = vi.fn();
    render(<AvatarUpload {...defaultProps} onUpdate={onUpdate} />);

    const input = document.querySelector("input[type='file']") as HTMLInputElement;
    const file = makeFile("avatar.jpg", "image/jpeg", 100);

    await userEvent.upload(input, file);

    await waitFor(() => {
      expect(mockPresignAvatar).toHaveBeenCalledWith(
        { content_type: "image/jpeg", file_size_bytes: file.size },
        "fake-token",
      );
    });

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        "https://s3.amazonaws.com/bucket/avatar.jpg?token=x",
        expect.objectContaining({ method: "PUT", body: file }),
      );
    });

    await waitFor(() => {
      expect(mockUpdateAvatar).toHaveBeenCalledWith(
        "https://s3.amazonaws.com/bucket/avatar.jpg",
        "fake-token",
      );
    });

    await waitFor(() => {
      expect(onUpdate).toHaveBeenCalledWith("https://s3.amazonaws.com/bucket/avatar.jpg");
    });
  });

  it("shows loading state while uploading", async () => {
    mockPresignAvatar.mockReturnValue(new Promise(() => {}));

    render(<AvatarUpload {...defaultProps} />);
    const input = document.querySelector("input[type='file']") as HTMLInputElement;
    const file = makeFile("avatar.jpg", "image/jpeg", 100);

    await userEvent.upload(input, file);

    await waitFor(() => {
      expect(screen.getByText(/enviando/i)).toBeInTheDocument();
    });
  });

  it("shows error message when upload fails", async () => {
    mockPresignAvatar.mockRejectedValue(new Error("Falha ao gerar URL de upload"));

    render(<AvatarUpload {...defaultProps} />);
    const input = document.querySelector("input[type='file']") as HTMLInputElement;
    const file = makeFile("avatar.jpg", "image/jpeg", 100);

    await userEvent.upload(input, file);

    await waitFor(() => {
      expect(screen.getByText("Falha ao gerar URL de upload")).toBeInTheDocument();
    });
  });

  it("shows error when S3 PUT fails", async () => {
    mockPresignAvatar.mockResolvedValue({
      data: {
        upload_url: "https://s3.amazonaws.com/bucket/avatar.jpg?token=x",
        final_url: "https://s3.amazonaws.com/bucket/avatar.jpg",
      },
    });
    mockFetch.mockResolvedValue({ ok: false });

    render(<AvatarUpload {...defaultProps} />);
    const input = document.querySelector("input[type='file']") as HTMLInputElement;
    const file = makeFile("avatar.jpg", "image/jpeg", 100);

    await userEvent.upload(input, file);

    await waitFor(() => {
      expect(screen.getByText(/falha ao enviar/i)).toBeInTheDocument();
    });
  });

  it("removes avatar and calls onUpdate with null", async () => {
    mockDeleteAvatar.mockResolvedValue(undefined);
    const onUpdate = vi.fn();

    render(
      <AvatarUpload
        {...defaultProps}
        currentAvatarUrl="https://example.com/avatar.jpg"
        onUpdate={onUpdate}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: /remover/i }));

    await waitFor(() => {
      expect(mockDeleteAvatar).toHaveBeenCalledWith("fake-token");
    });

    await waitFor(() => {
      expect(onUpdate).toHaveBeenCalledWith(null);
    });
  });

  it("shows error when delete fails", async () => {
    mockDeleteAvatar.mockRejectedValue(new Error("Erro ao remover avatar"));

    render(
      <AvatarUpload {...defaultProps} currentAvatarUrl="https://example.com/avatar.jpg" />,
    );

    await userEvent.click(screen.getByRole("button", { name: /remover/i }));

    await waitFor(() => {
      expect(screen.getByText("Erro ao remover avatar")).toBeInTheDocument();
    });
  });
});
