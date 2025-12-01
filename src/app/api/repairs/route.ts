returnMethod,
    status: 'pending_check',
        });

return NextResponse.json({ success: true });
    } catch (error) {
    console.error('Error creating repair:', error);
    return NextResponse.json({ error: 'Failed to create repair' }, { status: 500 });
}
}
