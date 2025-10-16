import React from "react";
import Modal from "../ui/Modal";
import Button from "../ui/Button";

export default function UploadModal({ 
	isOpen, 
	onClose, 
	uploadDrag, 
	setUploadDrag, 
	uploadFiles, 
	setUploadFiles, 
	fileInputRef, 
	onComplete 
}) {
	return (
		<Modal isOpen={isOpen} onClose={onClose} title="Tải tệp lên">
			<div className="space-y-4">
				<div
					onDragOver={(e) => { e.preventDefault(); setUploadDrag(true); }}
					onDragLeave={() => setUploadDrag(false)}
					onDrop={(e) => { 
						e.preventDefault(); 
						setUploadDrag(false); 
						const files = Array.from(e.dataTransfer.files); 
						setUploadFiles(files); 
					}}
					className={`flex h-48 items-center justify-center rounded-md border-2 border-dashed ${
						uploadDrag ? "border-blue-400 bg-blue-50" : "border-gray-300"
					}`}
				>
					<div className="text-center text-gray-600">
						<div className="mx-auto mb-3 grid h-10 w-10 place-items-center rounded-full bg-gray-100 text-gray-500">
							<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-6 w-6">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M16 12l-4-4-4 4m4-4v12"/>
							</svg>
						</div>
						<div>Kéo và thả tệp vào đây, hoặc</div>
						<div className="mt-3">
							<input ref={fileInputRef} type="file" multiple className="hidden" onChange={(e) => setUploadFiles(Array.from(e.target.files))} />
							<Button variant="secondary" onClick={() => fileInputRef.current?.click()}>Chọn tệp</Button>
						</div>
					</div>
				</div>
				<div className="flex items-center justify-between text-sm text-gray-600">
					<div>{uploadFiles.length ? `${uploadFiles.length} tệp đã chọn` : "Chưa chọn tệp nào"}</div>
					<div className="flex gap-2">
						<Button variant="secondary" onClick={onClose}>Hủy</Button>
						<Button onClick={onComplete} disabled={!uploadFiles.length}>Upload</Button>
					</div>
				</div>
			</div>
		</Modal>
	);
}
