import React, { useState, useRef, useEffect } from "react";
import Button from "../ui/Button";
import Input from "../ui/Input";

export default function Chatbot() {
	const data = {
		initialMessages: [
			{ role: 'bot', text: 'Xin chào! Tôi là Chatbot IEMS. Tôi có thể hỗ trợ gì?' },
		],
		botAckPrefix: 'Đã nhận: ',
		fileAckPrefix: 'Đã nhận tệp: ',
	};
	const [messages, setMessages] = useState(data.initialMessages);
	const [text, setText] = useState("");
	const endRef = useRef(null);
	const fileRef = useRef(null);

	useEffect(() => {
		endRef.current?.scrollIntoView({ behavior: 'smooth' });
	}, [messages]);

	function send() {
		if (!text.trim()) return;
		const userMsg = { role: 'user', text: text.trim() };
		setMessages(prev => [...prev, userMsg]);
		setText("");
		setTimeout(() => {
			setMessages(prev => [...prev, { role: 'bot', text: data.botAckPrefix + userMsg.text }]);
		}, 450);
	}

	function onKeyDown(e) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			send();
		}
	}

	function onPickFile() {
		fileRef.current?.click();
	}

	function onFileChange(e) {
		const file = e.target.files?.[0];
		if (!file) return;
		const isImage = file.type.startsWith('image/');
		const url = URL.createObjectURL(file);
		const userMsg = { role: 'user', file: { name: file.name, url, type: file.type, isImage } };
		setMessages(prev => [...prev, userMsg]);
		// Simulate bot ack
		setTimeout(() => {
			setMessages(prev => [...prev, { role: 'bot', text: data.fileAckPrefix + file.name }]);
		}, 450);
		// reset input value so same file can be picked again
		e.target.value = "";
	}

	return (
		<div className="flex h-full flex-col p-4">
			<div className="flex-1 overflow-auto pr-1">
				<div className="flex min-h-full flex-col justify-end">
					<div className="space-y-3">
						{messages.map((m, i) => (
							<div key={i} className={`${m.role === 'user' ? 'text-right' : 'text-left'}`}>
								{m.file ? (
									<div className="inline-block max-w-[80%] rounded-2xl bg-blue-50 p-3 text-left text-sm text-blue-900 shadow-sm">
										<div className="font-medium">{m.file.name}</div>
										{m.file.isImage ? (
											<img src={m.file.url} alt={m.file.name} className="mt-2 max-h-48 rounded-md object-contain" />
										) : (
											<a href={m.file.url} download className="mt-2 inline-block underline">Tải xuống</a>
										)}
									</div>
								) : (
									<span className={`inline-block max-w-[80%] rounded-2xl px-4 py-2 text-sm leading-relaxed shadow-sm ${m.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100'}`}>
										{m.text}
									</span>
								)}
							</div>
						))}
						<div ref={endRef} />
					</div>
				</div>
			</div>
			<div className="mt-3 flex items-end gap-2">
				<div className="flex-1">
					<Input
						placeholder="Nhập tin nhắn..."
						value={text}
						onChange={e => setText(e.target.value)}
						onKeyDown={onKeyDown}
					/>
				</div>
				<Button aria-label="Gửi tin nhắn" onClick={send}>Gửi</Button>
			</div>
		</div>
	);
}
